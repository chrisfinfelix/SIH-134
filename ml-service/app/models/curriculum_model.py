"""
Curriculum recommendation: LightGBM ranking model (LGBMRanker, lambdarank
objective) over course/skill/demand features, ranking which courses best
serve a target role (optionally scoped to a district).

Since no real click/enrollment judgments exist yet, training uses weak
relevance labels built from the same features (a linear combination of skill
overlap, demand score, and capacity headroom) -- the ranker's value here is
learning the *combination* rather than memorizing a hand-tuned formula, and
this is trivially replaced by real relevance signals (course completions,
employer feedback) later without touching the API.
"""
import logging
import os
from functools import lru_cache

import numpy as np

from app.features.curriculum_features import FEATURE_COLUMNS, build_course_role_features
from app.models.taxonomy_loader import load_occupations
from app.store.feature_store import load_demand_timeseries

logger = logging.getLogger(__name__)

HERE = os.path.dirname(__file__)
CHECKPOINT_PATH = os.path.join(HERE, "..", "..", "training", "checkpoints", "curriculum_ranker.txt")


def _weak_relevance(df):
    demand_norm = df["demand_score"] / (df["demand_score"].max() or 1)
    return (0.5 * df["skill_overlap_ratio"] + 0.35 * demand_norm + 0.15 * df["capacity_headroom"]).values


def _weak_relevance_grades(df, n_grades: int = 5):
    """LightGBM's lambdarank objective requires integer relevance grades."""
    scores = _weak_relevance(df)
    grades = np.clip((scores * n_grades).astype(int), 0, n_grades - 1)
    return grades


@lru_cache(maxsize=1)
def _load_or_train_ranker(force_retrain: bool = False):
    import lightgbm as lgb

    if os.path.exists(CHECKPOINT_PATH) and not force_retrain:
        try:
            return lgb.Booster(model_file=CHECKPOINT_PATH)
        except Exception as e:
            logger.warning("Failed to load cached curriculum ranker, retraining: %s", e)

    try:
        occs = load_occupations()
        load_demand_timeseries()  # ensures synthetic data exists
    except FileNotFoundError:
        return None

    all_features = []
    all_labels = []
    group_sizes = []
    for occ in occs:
        df = build_course_role_features(occ["title"])
        if df.empty:
            continue
        labels = _weak_relevance_grades(df)
        all_features.append(df[FEATURE_COLUMNS])
        all_labels.append(labels)
        group_sizes.append(len(df))

    if not all_features:
        return None

    import pandas as pd

    X = pd.concat(all_features, ignore_index=True)
    y = np.concatenate(all_labels)

    ranker = lgb.LGBMRanker(
        objective="lambdarank",
        num_leaves=15,
        min_child_samples=5,
        learning_rate=0.08,
        n_estimators=100,
        verbosity=-1,
    )
    ranker.fit(X, y, group=group_sizes)

    os.makedirs(os.path.dirname(CHECKPOINT_PATH), exist_ok=True)
    ranker.booster_.save_model(CHECKPOINT_PATH)
    return ranker.booster_


def train():
    """Explicit entry point for training/train_curriculum_ranker.py: always retrains and overwrites the checkpoint."""
    _load_or_train_ranker.cache_clear()
    return _load_or_train_ranker(force_retrain=True)


def recommend_curriculum(role_title: str, location: str | None = None, top_k: int = 5) -> dict:
    df = build_course_role_features(role_title, location)
    if df.empty:
        return {"role_title": role_title, "location": location, "recommendations": []}

    booster = _load_or_train_ranker()
    if booster is not None:
        scores = booster.predict(df[FEATURE_COLUMNS])
    else:
        scores = _weak_relevance(df)

    df = df.assign(rank_score=scores).sort_values("rank_score", ascending=False).head(top_k)

    recs = []
    for _, row in df.iterrows():
        rationale_parts = []
        if row["skill_overlap_ratio"] > 0.5:
            rationale_parts.append("strong existing skill-set coverage for this role")
        if row["demand_score"] > 0:
            rationale_parts.append("positive recent demand signal")
        if row["capacity_headroom"] > 0.3:
            rationale_parts.append("seats available")
        rationale = "; ".join(rationale_parts) or "closest available match"
        recs.append(
            {
                "course_id": row["course_id"],
                "course_name": row["course_name"],
                "rank_score": round(float(row["rank_score"]), 4),
                "rationale": rationale,
            }
        )

    return {"role_title": role_title, "location": location, "recommendations": recs}
