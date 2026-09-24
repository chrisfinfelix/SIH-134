from fastapi import APIRouter

from app.models.district_plan_model import optimize_district_plan
from app.schemas.schemas import DistrictPlanRequest, DistrictPlanResponse

router = APIRouter(prefix="/district-plan", tags=["district-plan"])


@router.post("/optimize", response_model=DistrictPlanResponse)
def optimize_endpoint(body: DistrictPlanRequest):
    result = optimize_district_plan(body.district, body.budget, body.max_courses)
    return DistrictPlanResponse(**result)
