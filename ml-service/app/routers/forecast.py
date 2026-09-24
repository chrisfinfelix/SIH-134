from typing import Optional

from fastapi import APIRouter, Query

from app.models.forecast_model import forecast_demand
from app.schemas.schemas import ForecastResponse

router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.get("/demand", response_model=ForecastResponse)
def demand_endpoint(
    role: Optional[str] = Query(None, description="Occupation title, e.g. 'Software Developer'"),
    skill: Optional[str] = Query(None, description="Canonical skill name, e.g. 'Python'"),
    location: Optional[str] = Query(None, description="District name, e.g. 'Pune'"),
):
    result = forecast_demand(role, skill, location)
    return ForecastResponse(**result)
