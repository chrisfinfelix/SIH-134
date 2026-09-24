from functools import lru_cache

from fastapi import APIRouter

from app.models.taxonomy_loader import load_occupations, load_skills
from app.schemas.schemas import MetaOptionsResponse
from app.store.feature_store import load_courses, load_demand_timeseries

router = APIRouter(prefix="/meta", tags=["meta"])


@lru_cache(maxsize=1)
def _options() -> dict:
    ts = load_demand_timeseries()
    courses = load_courses()
    series = (
        ts[["role_title", "skill", "location"]]
        .drop_duplicates()
        .sort_values(["role_title", "skill", "location"])
        .to_dict(orient="records")
    )
    return {
        "roles": sorted(o["title"] for o in load_occupations()),
        "skills": sorted(s["canonical_name"] for s in load_skills()),
        "districts": sorted(set(ts["location"]) | set(courses["district"])),
        "courses": [
            {"course_id": r.course_id, "course_name": r.course_name, "district": r.district, "sector": r.sector}
            for r in courses.sort_values("course_id").itertuples()
        ],
        "forecast_series": series,
    }


@router.get("/options", response_model=MetaOptionsResponse)
def options_endpoint():
    """Valid inputs for the forecast, oversupply, curriculum and district-plan endpoints."""
    return MetaOptionsResponse(**_options())
