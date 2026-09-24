"""
End-to-end demo: runs one synthetic job posting and one synthetic course
through every module of the pipeline, printing (and saving) a single JSON
blob shaped like what the dashboard would show.

Usage:
    python notebooks_or_scripts/demo_end_to_end.py
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.models.career_path_model import get_career_path  # noqa: E402
from app.models.curriculum_model import recommend_curriculum  # noqa: E402
from app.models.district_plan_model import optimize_district_plan  # noqa: E402
from app.models.forecast_model import forecast_demand  # noqa: E402
from app.models.ingest_model import ingest_record  # noqa: E402
from app.models.job_title_model import classify_job_title  # noqa: E402
from app.models.ner_model import extract_entities  # noqa: E402
from app.models.oversupply_model import check_oversupply  # noqa: E402
from app.models.skill_gap_model import analyze_skill_gap  # noqa: E402
from app.models.skill_standardizer import standardize_skill  # noqa: E402
from app.models.trend_model import get_emerging_topics  # noqa: E402
from app.store.feature_store import load_courses, load_demand_timeseries, load_job_postings


def section(title):
    print(f"\n{'=' * 70}\n{title}\n{'=' * 70}")


def main():
    output = {}

    # ---- pick one synthetic job posting to drive the pipeline ----
    postings = load_job_postings()
    posting = postings.iloc[0]

    section("1. Ingest (dedup)")
    ingest_result = ingest_record("job_portal", {"posting_id": posting["posting_id"], "description": posting["description"]})
    ingest_again = ingest_record("job_portal", {"posting_id": posting["posting_id"], "description": posting["description"]})
    print("First ingest (new):", ingest_result)
    print("Re-ingest same record (duplicate):", ingest_again)
    output["ingest"] = ingest_result

    section("2. NER: skill/entity extraction")
    print("Text:", posting["description"])
    entities = extract_entities(posting["description"])
    print(entities)
    output["ner"] = entities

    section("3. Job title classification")
    title_pred = classify_job_title(posting["title"])
    print(f"Title: {posting['title']}")
    print(title_pred)
    output["job_title_classification"] = title_pred

    section("4. Skill standardization")
    raw_skill = "reactjs"
    std = standardize_skill(raw_skill)
    print(std)
    output["skill_standardization_example"] = std

    section("5. Demand forecasting")
    ts = load_demand_timeseries()
    sample_row = ts.iloc[0]
    forecast = forecast_demand(sample_row["role_title"], sample_row["skill"], sample_row["location"])
    print(f"Series: {sample_row['role_title']} / {sample_row['skill']} / {sample_row['location']}")
    print(f"Method: {forecast['method']}, {len(forecast['forecast'])} points")
    output["forecast_example"] = forecast

    section("6. Skill gap analysis")
    gap = analyze_skill_gap(["Python", "SQL", "Excel"], "Data Scientist")
    print(gap)
    output["skill_gap_example"] = gap

    section("7. Emerging trend detection (BERTopic -- may take ~30s the first time)")
    trends = get_emerging_topics()
    print(f"{len(trends['topics'])} topics found")
    for t in trends["topics"][:3]:
        print(" -", t["label"], "| docs:", t["doc_count"], "| growth:", t["growth_pct"], "%")
    output["trend_topics"] = trends["topics"]

    section("8. Oversupply classifier")
    courses = load_courses()
    oversupplied_course = courses[courses["_synthetic_oversupplied"]].iloc[0]
    oversupply = check_oversupply(oversupplied_course["course_id"])
    print(f"Course: {oversupplied_course['course_name']} ({oversupplied_course['course_id']})")
    print(oversupply)
    output["oversupply_example"] = oversupply

    section("9. Curriculum recommendation")
    curriculum = recommend_curriculum("Data Scientist", None)
    print(curriculum)
    output["curriculum_example"] = curriculum

    section("10. District training plan optimization")
    district = courses.iloc[0]["district"]
    plan = optimize_district_plan(district, budget=1_000_000, max_courses=5)
    print(plan)
    output["district_plan_example"] = plan

    section("11. Career pathway recommendation")
    path = get_career_path("Python")
    print(path)
    output["career_path_example"] = path

    out_path = ROOT / "notebooks_or_scripts" / "demo_output.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, default=str)
    section(f"Done. Full output saved to {out_path}")


if __name__ == "__main__":
    main()
