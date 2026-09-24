"""Shared feature engineering for the global demand-forecasting model."""
import numpy as np
import pandas as pd

N_LAGS = 3
ROLLING_WINDOW = 3


def build_series_id(df: pd.DataFrame) -> pd.Series:
    return df["role_title"] + "||" + df["skill"] + "||" + df["location"]


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Adds lag features, rolling means, and a seasonality dummy per series.

    Expects columns: month (date-like), role_title, skill, location, openings.
    """
    df = df.copy()
    df["month"] = pd.to_datetime(df["month"])
    df["series_id"] = build_series_id(df)
    df = df.sort_values(["series_id", "month"])

    for lag in range(1, N_LAGS + 1):
        df[f"lag_{lag}"] = df.groupby("series_id")["openings"].shift(lag)

    df["rolling_mean"] = df.groupby("series_id")["openings"].transform(
        lambda s: s.shift(1).rolling(ROLLING_WINDOW, min_periods=1).mean()
    )
    df["month_num"] = df["month"].dt.month
    df["month_sin"] = np.sin(2 * np.pi * df["month_num"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month_num"] / 12)

    df["history_len"] = df.groupby("series_id").cumcount() + 1
    return df


FEATURE_COLUMNS = [f"lag_{i}" for i in range(1, N_LAGS + 1)] + ["rolling_mean", "month_sin", "month_cos", "history_len"]

COLD_START_MIN_HISTORY = N_LAGS + 2  # need at least this many points for lag features to be non-null
