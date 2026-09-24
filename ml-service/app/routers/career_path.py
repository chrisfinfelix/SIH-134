from fastapi import APIRouter, Query

from app.models.career_path_model import get_career_path
from app.schemas.schemas import CareerPathResponse

router = APIRouter(prefix="/career-path", tags=["career-path"])


@router.get("/{skill_or_role}", response_model=CareerPathResponse)
def career_path_endpoint(skill_or_role: str, top_k: int = Query(8, ge=1, le=25)):
    result = get_career_path(skill_or_role, top_k=top_k)
    return CareerPathResponse(**result)
