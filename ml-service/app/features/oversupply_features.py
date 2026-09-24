"""Feature engineering + weak labeling for the oversupply classifier."""
import numpy as np
import pandas as pd

from app.store.feature_store import load_courses, load_placements, load_demand_timeseries

FEATURE_COLUMNS = ["enrollment_capacity_ratio", "placement_rate", "trend_slope", "sector_growth_pct"]

# weak-label rule per architecture spec
RULE_RATIO_THRESHOLD = 3.0
RULE_PLACEMENT_THRESHOLD = 0.4
RULE_TREND_THRESHOLD = 0.0


def build_oversupply_feature_table() -> pd.DataFrame:
    courses = load_courses()
    placements = load_placements()
    timeseries = load_demand_timeseries()

    df = courses.merge(placements, on="course_id", how="left")
    df["enrollment_capacity_ratio"] = df["enrollment"] / df["seat_capacity"].replace(0, np.nan)
    df["placement_rate"] = df["placement_rate"].fillna(0.5)

    timeseries = timeseries.copy()
    timeseries["month"] = pd.to_datetime(timeseries["month"])

    # trend slope + sector growth per row, matched by the course's target occupation's sector via skills taught
    trend_by_skill = {}
    for skill, grp in timeseries.groupby("skill"):
        monthly = grp.groupby("month")["openings"].sum().sort_index()
        if len(monthly) >= 3:
            x = np.arange(len(monthly))
            slope = float(np.polyfit(x, monthly.values, 1)[0])
        else:
            slope = 0.0
        trend_by_skill[skill] = slope

    def row_trend_slope(skills_taught):
        slopes = [trend_by_skill.get(s, 0.0) for s in skills_taught if s in trend_by_skill]
        return float(np.mean(slopes)) if slopes else 0.0

    df["trend_slope"] = df["skills_taught"].apply(row_trend_slope)

    # sector growth: compare last third vs prior for each course's own skills' aggregate series
    def row_sector_growth(skills_taught):
        sub = timeseries[timeseries["skill"].isin(skills_taught)]
        if sub.empty:
            return 0.0
        monthly = sub.groupby("month")["openings"].sum().sort_index()
        if len(monthly) < 4:
            return 0.0
        cutoff = int(len(monthly) * (2 / 3))
        prior = monthly.iloc[:cutoff].mean()
        recent = monthly.iloc[cutoff:].mean()
        if prior <= 0:
            return 0.0
        return float(((recent - prior) / prior) * 100)

    df["sector_growth_pct"] = df["skills_taught"].apply(row_sector_growth)

    df["weak_label"] = (
        (df["enrollment_capacity_ratio"] > RULE_RATIO_THRESHOLD)
        & (df["placement_rate"] < RULE_PLACEMENT_THRESHOLD)
        & (df["trend_slope"] < RULE_TREND_THRESHOLD)
    ).astype(int)

    return df
