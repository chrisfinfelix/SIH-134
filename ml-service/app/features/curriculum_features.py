"""Feature engineering for the curriculum-recommendation LightGBM ranker."""
import numpy as np
import pandas as pd

from app.models.taxonomy_loader import load_occupations
from app.store.feature_store import load_courses, load_demand_timeseries

FEATURE_COLUMNS = ["skill_overlap_ratio", "demand_score", "capacity_headroom", "sector_match"]


def _skill_overlap_ratio(course_skills: list[str], role_skills: list[str]) -> float:
    if not role_skills:
        return 0.0
    course_set = set(course_skills)
    role_set = set(role_skills)
    return len(course_set & role_set) / len(role_set)


def _demand_score_for_skills(timeseries: pd.DataFrame, skills: list[str]) -> float:
    sub = timeseries[timeseries["skill"].isin(skills)]
    if sub.empty:
        return 0.0
    monthly = sub.groupby("month")["openings"].sum().sort_index()
    recent = monthly.tail(3).mean() if len(monthly) else 0.0
    return float(recent)


def build_course_role_features(role_title: str, location: str | None = None) -> pd.DataFrame:
    occs = {o["title"]: o for o in load_occupations()}
    occ = occs.get(role_title)
    role_skills = occ["typical_skills"] if occ else []

    courses = load_courses()
    if location:
        courses = courses[courses["district"] == location]
    if courses.empty:
        courses = load_courses()  # fall back to all districts if none match

    timeseries = load_demand_timeseries()
    if location:
        loc_ts = timeseries[timeseries["location"] == location]
        if not loc_ts.empty:
            timeseries = loc_ts

    rows = []
    for _, c in courses.iterrows():
        overlap = _skill_overlap_ratio(c["skills_taught"], role_skills)
        demand = _demand_score_for_skills(timeseries, role_skills)
        headroom = max(0.0, 1.0 - (c["enrollment"] / max(c["seat_capacity"], 1)))
        sector_match = 1.0 if occ and c["sector"] == occ["sector"] else 0.0
        rows.append(
            {
                "course_id": c["course_id"],
                "course_name": c["course_name"],
                "skill_overlap_ratio": overlap,
                "demand_score": demand,
                "capacity_headroom": headroom,
                "sector_match": sector_match,
            }
        )
    return pd.DataFrame(rows)
