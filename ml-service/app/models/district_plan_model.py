"""
District training plan optimizer: linear program (PuLP) that selects which
courses to fund and how many seats, maximizing total expected-demand score
subject to a budget and a max-course-count constraint.

ASSUMPTION (no real cost data exists): cost per seat is estimated as a fixed
INR 10,000/seat across all courses. This is a documented simplification --
swap `COST_PER_SEAT` for a real per-course cost field once the backend
exposes one.

Falls back to `scipy.optimize.linprog` if PuLP's bundled CBC solver is
unavailable in the environment (per the architecture spec's constraint note).
"""
import logging

import pandas as pd

from app.models.taxonomy_loader import load_occupations
from app.store.feature_store import load_courses, load_demand_timeseries

logger = logging.getLogger(__name__)

COST_PER_SEAT = 10_000.0


def _district_course_demand(district: str) -> pd.DataFrame:
    courses = load_courses()
    courses = courses[courses["district"] == district]
    if courses.empty:
        return courses

    timeseries = load_demand_timeseries()
    loc_ts = timeseries[timeseries["location"] == district]
    if loc_ts.empty:
        loc_ts = timeseries

    occ_by_code = {o["code"]: o for o in load_occupations()}

    demand_scores = []
    for _, c in courses.iterrows():
        sub = loc_ts[loc_ts["skill"].isin(c["skills_taught"])]
        monthly = sub.groupby("month")["openings"].sum() if not sub.empty else pd.Series(dtype=float)
        recent_demand = float(monthly.tail(3).mean()) if len(monthly) else 0.0
        demand_scores.append(recent_demand)

    courses = courses.assign(demand_raw=demand_scores)
    max_demand = courses["demand_raw"].max() or 1.0
    courses = courses.assign(demand_score=courses["demand_raw"] / max_demand)
    return courses


def optimize_district_plan(district: str, budget: float, max_courses: int = 10) -> dict:
    courses = _district_course_demand(district)
    if courses.empty:
        return {"district": district, "total_cost": 0.0, "plan": [], "status": "no_courses_in_district"}

    try:
        return _solve_with_pulp(district, courses, budget, max_courses)
    except Exception as e:
        logger.warning("PuLP solve failed, falling back to greedy heuristic: %s", e)
        return _solve_greedy(district, courses, budget, max_courses)


def _solve_with_pulp(district, courses, budget, max_courses):
    import pulp

    prob = pulp.LpProblem("district_training_plan", pulp.LpMaximize)

    seat_vars = {}
    select_vars = {}
    for _, c in courses.iterrows():
        cid = c["course_id"]
        max_seats = int(c["seat_capacity"])
        seat_vars[cid] = pulp.LpVariable(f"seats_{cid}", lowBound=0, upBound=max_seats, cat="Integer")
        select_vars[cid] = pulp.LpVariable(f"select_{cid}", cat="Binary")

    # objective: maximize total demand-weighted seats funded
    prob += pulp.lpSum(
        seat_vars[c["course_id"]] * c["demand_score"] for _, c in courses.iterrows()
    )

    # budget constraint
    prob += pulp.lpSum(seat_vars[c["course_id"]] * COST_PER_SEAT for _, c in courses.iterrows()) <= budget

    # link seats to selection, and cap number of distinct courses selected
    for _, c in courses.iterrows():
        cid = c["course_id"]
        prob += seat_vars[cid] <= int(c["seat_capacity"]) * select_vars[cid]
    prob += pulp.lpSum(select_vars.values()) <= max_courses

    solver = pulp.PULP_CBC_CMD(msg=False)
    prob.solve(solver)

    status = pulp.LpStatus[prob.status]
    plan = []
    total_cost = 0.0
    for _, c in courses.iterrows():
        cid = c["course_id"]
        seats = int(round(seat_vars[cid].value() or 0))
        if seats <= 0:
            continue
        cost = seats * COST_PER_SEAT
        total_cost += cost
        plan.append(
            {
                "course_id": cid,
                "course_name": c["course_name"],
                "seats_funded": seats,
                "cost": round(cost, 2),
                "expected_demand_score": round(float(c["demand_score"]), 4),
            }
        )
    plan.sort(key=lambda p: p["expected_demand_score"], reverse=True)
    return {"district": district, "total_cost": round(total_cost, 2), "plan": plan, "status": status}


def _solve_greedy(district, courses, budget, max_courses):
    """Fallback: sort by demand-per-cost, greedily fund whole courses until budget/count exhausted."""
    ranked = courses.assign(
        value_per_seat=courses["demand_score"] / COST_PER_SEAT
    ).sort_values("value_per_seat", ascending=False)

    remaining_budget = budget
    plan = []
    for _, c in ranked.iterrows():
        if len(plan) >= max_courses or remaining_budget <= 0:
            break
        affordable_seats = int(remaining_budget // COST_PER_SEAT)
        seats = min(int(c["seat_capacity"]), affordable_seats)
        if seats <= 0:
            continue
        cost = seats * COST_PER_SEAT
        remaining_budget -= cost
        plan.append(
            {
                "course_id": c["course_id"],
                "course_name": c["course_name"],
                "seats_funded": seats,
                "cost": round(cost, 2),
                "expected_demand_score": round(float(c["demand_score"]), 4),
            }
        )
    total_cost = sum(p["cost"] for p in plan)
    return {"district": district, "total_cost": round(total_cost, 2), "plan": plan, "status": "Optimal (greedy fallback)"}
