"""
Oversupply classifier: LightGBM binary classifier trained on weak labels
generated from the rule heuristic (enrollment/capacity > 3.0 AND placement <
0.4 AND trend_slope < 0), using richer engineered features than the rule
alone. Explained per-course with SHAP top contributing features instead of
just returning the binary flag.
"""
import logging
import os
from functools import lru_cache

import numpy as np
import pandas as pd

from app.features.oversupply_features import FEATURE_COLUMNS, build_oversupply_feature_table

logger = logging.getLogger(__name__)

HERE = os.path.dirname(__file__)
CHECKPOINT_PATH = os.path.join(HERE, "..", "..", "training", "checkpoints", "oversupply_lgbm.txt")
DECISION_THRESHOLD = 0.5


@lru_cache(maxsize=1)
def _load_or_train(force_retrain: bool = False):
    import lightgbm as lgb

    feature_table = build_oversupply_feature_table()

    booster = None
    if os.path.exists(CHECKPOINT_PATH) and not force_retrain:
        try:
            booster = lgb.Booster(model_file=CHECKPOINT_PATH)
        except Exception as e:
            logger.warning("Failed to load cached oversupply model, retraining: %s", e)
            booster = None

    if booster is None:
        if feature_table["weak_label"].nunique() < 2 or len(feature_table) < 20:
            return None, feature_table  # not enough signal to train a classifier yet
        X = feature_table[FEATURE_COLUMNS]
        y = feature_table["weak_label"]
        train_set = lgb.Dataset(X, label=y)
        params = {
            "objective": "binary",
            "metric": "auc",
            "verbosity": -1,
            "num_leaves": 15,
            "min_data_in_leaf": 5,
            "learning_rate": 0.08,
        }
        booster = lgb.train(params, train_set, num_boost_round=100)
        os.makedirs(os.path.dirname(CHECKPOINT_PATH), exist_ok=True)
        booster.save_model(CHECKPOINT_PATH)

    return booster, feature_table


def train():
    """Explicit entry point for training/train_oversupply_model.py: always retrains and overwrites the checkpoint."""
    _load_or_train.cache_clear()
    return _load_or_train(force_retrain=True)


def check_oversupply(course_id: str) -> dict:
    booster, feature_table = _load_or_train()
    row = feature_table[feature_table["course_id"] == course_id]
    if row.empty:
        return {"course_id": course_id, "oversupply_probability": 0.0, "label": "unknown_course", "top_reasons": []}

    X_row = row[FEATURE_COLUMNS]

    if booster is None:
        # not enough data to train the classifier -- degrade to the rule heuristic directly
        prob = float(row["weak_label"].iloc[0])
        return {
            "course_id": course_id,
            "oversupply_probability": prob,
            "label": "oversupplied" if prob >= DECISION_THRESHOLD else "balanced",
            "top_reasons": [{"feature": "rule_heuristic", "shap_value": prob}],
        }

    prob = float(booster.predict(X_row)[0])
    label = "oversupplied" if prob >= DECISION_THRESHOLD else "balanced"

    top_reasons = []
    try:
        import shap

        explainer = shap.TreeExplainer(booster)
        shap_values = explainer.shap_values(X_row)
        values = np.asarray(shap_values).reshape(-1)
        contribs = sorted(zip(FEATURE_COLUMNS, values), key=lambda kv: abs(kv[1]), reverse=True)
        top_reasons = [{"feature": f, "shap_value": round(float(v), 4)} for f, v in contribs[:3]]
    except Exception as e:
        logger.warning("SHAP explanation failed: %s", e)
        top_reasons = [{"feature": f, "shap_value": round(float(X_row[f].iloc[0]), 4)} for f in FEATURE_COLUMNS[:3]]

    return {"course_id": course_id, "oversupply_probability": round(prob, 4), "label": label, "top_reasons": top_reasons}
