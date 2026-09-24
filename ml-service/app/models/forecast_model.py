"""
Demand forecasting: one global LightGBM regressor trained across every
role x skill x location series at once (lag + rolling + seasonality
features), used for series with enough history. Series with too little
history (cold start, e.g. a newly-emerging skill combo) fall back to
Prophet fitted per-series, since lag features aren't meaningful yet.

Training happens lazily on first request (or via training/train_forecast_model.py
ahead of time) and the fitted LightGBM booster is cached under
training/checkpoints/forecast_lgbm.txt.
"""
import logging
import os
from functools import lru_cache

import numpy as np
import pandas as pd

from app.features.forecast_features import (
    COLD_START_MIN_HISTORY,
    FEATURE_COLUMNS,
    N_LAGS,
    ROLLING_WINDOW,
    build_series_id,
    engineer_features,
)
from app.store.feature_store import load_demand_timeseries

logger = logging.getLogger(__name__)

HERE = os.path.dirname(__file__)
CHECKPOINT_PATH = os.path.join(HERE, "..", "..", "training", "checkpoints", "forecast_lgbm.txt")
HORIZON = 6
HISTORY_MONTHS = 12


@lru_cache(maxsize=1)
def _load_or_train_lgbm(force_retrain: bool = False):
    import lightgbm as lgb

    if os.path.exists(CHECKPOINT_PATH) and not force_retrain:
        try:
            return lgb.Booster(model_file=CHECKPOINT_PATH)
        except Exception as e:
            logger.warning("Failed to load cached forecast model, retraining: %s", e)

    try:
        df = load_demand_timeseries()
    except FileNotFoundError:
        return None

    feat = engineer_features(df).dropna(subset=FEATURE_COLUMNS)
    if len(feat) < 50:
        return None

    train_set = lgb.Dataset(feat[FEATURE_COLUMNS], label=feat["openings"])
    params = {
        "objective": "regression",
        "metric": "mae",
        "verbosity": -1,
        "num_leaves": 15,
        "min_data_in_leaf": 5,
        "learning_rate": 0.08,
    }
    booster = lgb.train(params, train_set, num_boost_round=150)

    os.makedirs(os.path.dirname(CHECKPOINT_PATH), exist_ok=True)
    booster.save_model(CHECKPOINT_PATH)
    return booster


def train():
    """Explicit entry point for training/train_forecast_model.py: always retrains and overwrites the checkpoint."""
    _load_or_train_lgbm.cache_clear()
    return _load_or_train_lgbm(force_retrain=True)


def _series_history(role_title: str | None, skill: str | None, location: str | None) -> pd.DataFrame:
    df = load_demand_timeseries()
    if role_title:
        df = df[df["role_title"] == role_title]
    if skill:
        df = df[df["skill"] == skill]
    if location:
        df = df[df["location"] == location]
    return df.sort_values("month")


def _prophet_forecast(history: pd.DataFrame, periods: int) -> list[dict]:
    try:
        from prophet import Prophet

        hist = history.rename(columns={"month": "ds", "openings": "y"})[["ds", "y"]]
        hist["ds"] = pd.to_datetime(hist["ds"])
        model = Prophet(yearly_seasonality=len(hist) >= 12, weekly_seasonality=False, daily_seasonality=False)
        model.fit(hist)
        future = model.make_future_dataframe(periods=periods, freq="MS")
        fcst = model.predict(future).tail(periods)
        return [
            {
                "month": row["ds"].date().isoformat(),
                "predicted_openings": max(0.0, round(float(row["yhat"]), 2)),
                "lower_bound": max(0.0, round(float(row["yhat_lower"]), 2)),
                "upper_bound": max(0.0, round(float(row["yhat_upper"]), 2)),
            }
            for _, row in fcst.iterrows()
        ]
    except Exception as e:
        logger.warning("Prophet fallback failed: %s", e)
        # last resort: naive persistence of the last observed value
        last_val = float(history["openings"].iloc[-1]) if len(history) else 0.0
        last_month = pd.to_datetime(history["month"].iloc[-1]) if len(history) else pd.Timestamp.today()
        out = []
        for i in range(1, periods + 1):
            m = (last_month + pd.DateOffset(months=i)).date().isoformat()
            out.append({"month": m, "predicted_openings": last_val, "lower_bound": last_val * 0.7, "upper_bound": last_val * 1.3})
        return out


def _lgbm_recursive_forecast(booster, history: pd.DataFrame, periods: int) -> list[dict]:
    values = list(history["openings"].astype(float))
    last_month = pd.to_datetime(history["month"].iloc[-1])
    out = []
    for step in range(1, periods + 1):
        next_month = last_month + pd.DateOffset(months=step)
        lags = [values[-i] if len(values) >= i else 0.0 for i in range(1, N_LAGS + 1)]
        rolling_mean = float(np.mean(values[-ROLLING_WINDOW:])) if values else 0.0
        month_num = next_month.month
        row = {
            **{f"lag_{i+1}": lags[i] for i in range(N_LAGS)},
            "rolling_mean": rolling_mean,
            "month_sin": np.sin(2 * np.pi * month_num / 12),
            "month_cos": np.cos(2 * np.pi * month_num / 12),
            "history_len": len(values) + step,
        }
        X = pd.DataFrame([row])[FEATURE_COLUMNS]
        pred = max(0.0, float(booster.predict(X)[0]))
        values.append(pred)
        spread = max(1.0, pred * 0.25)
        out.append(
            {
                "month": next_month.date().isoformat(),
                "predicted_openings": round(pred, 2),
                "lower_bound": round(max(0.0, pred - spread), 2),
                "upper_bound": round(pred + spread, 2),
            }
        )
    return out


def _sum_forecasts(per_series: list[list[dict]]) -> list[dict]:
    """Sums aligned monthly forecasts; bounds are summed too (a conservative interval)."""
    totals: dict[str, dict] = {}
    for points in per_series:
        for p in points:
            t = totals.setdefault(p["month"], {"month": p["month"], "predicted_openings": 0.0, "lower_bound": 0.0, "upper_bound": 0.0})
            for key in ("predicted_openings", "lower_bound", "upper_bound"):
                t[key] += p[key]
    return [
        {k: round(v, 2) if isinstance(v, float) else v for k, v in totals[m].items()}
        for m in sorted(totals)
    ]


def forecast_demand(role_title: str | None, skill: str | None, location: str | None) -> dict:
    try:
        history = _series_history(role_title, skill, location)
    except FileNotFoundError:
        return {"role_title": role_title, "skill": skill, "location": location, "method": "insufficient_data", "forecast": []}

    if len(history) == 0:
        return {"role_title": role_title, "skill": skill, "location": location, "method": "insufficient_data", "forecast": []}

    agg = history.groupby("month", as_index=False)["openings"].sum().sort_values("month")

    # The global model was trained on individual series, and tree models cannot
    # extrapolate past the target range they saw, so a multi-series query is
    # forecast per series and then summed rather than fed as one aggregate.
    booster = _load_or_train_lgbm()
    per_series = []
    methods = set()
    for _, series in history.assign(series_id=build_series_id(history)).groupby("series_id"):
        series = series.sort_values("month")[["month", "openings"]]
        if booster is not None and len(series) >= COLD_START_MIN_HISTORY:
            per_series.append(_lgbm_recursive_forecast(booster, series, HORIZON))
            methods.add("lightgbm_global")
        else:
            per_series.append(_prophet_forecast(series, HORIZON))
            methods.add("prophet_fallback")

    forecast_points = _sum_forecasts(per_series)
    method = "lightgbm_global" if methods == {"lightgbm_global"} else "prophet_fallback" if methods == {"prophet_fallback"} else "hybrid"

    history_points = [
        {"month": pd.to_datetime(r.month).date().isoformat(), "openings": float(r.openings)}
        for r in agg.tail(HISTORY_MONTHS).itertuples()
    ]

    return {
        "role_title": role_title,
        "skill": skill,
        "location": location,
        "method": method,
        "history": history_points,
        "forecast": forecast_points,
    }
