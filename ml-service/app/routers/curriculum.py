from typing import Optional

from fastapi import APIRouter, Query

from app.models.curriculum_model import recommend_curriculum
from app.schemas.schemas import CurriculumRecommendResponse

router = APIRouter(prefix="/curriculum", tags=["curriculum"])


@router.get("/recommend", response_model=CurriculumRecommendResponse)
def recommend_endpoint(
    role: str = Query(..., description="Occupation title, e.g. 'Data Scientist'"),
    location: Optional[str] = Query(None, description="District name, e.g. 'Pune'"),
):
    result = recommend_curriculum(role, location)
    return CurriculumRecommendResponse(**result)
