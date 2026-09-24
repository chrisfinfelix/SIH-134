from fastapi import APIRouter

from app.models.skill_standardizer import standardize_skill
from app.schemas.schemas import SkillStandardizeRequest, SkillStandardizeResponse

router = APIRouter(prefix="/skill", tags=["skill"])


@router.post("/standardize", response_model=SkillStandardizeResponse)
def standardize_endpoint(body: SkillStandardizeRequest):
    result = standardize_skill(body.raw_skill)
    return SkillStandardizeResponse(**result)
