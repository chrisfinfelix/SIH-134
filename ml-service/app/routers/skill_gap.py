from fastapi import APIRouter

from app.models.skill_gap_model import analyze_skill_gap
from app.schemas.schemas import SkillGapAnalyzeRequest, SkillGapAnalyzeResponse

router = APIRouter(prefix="/skill-gap", tags=["skill-gap"])


@router.post("/analyze", response_model=SkillGapAnalyzeResponse)
def analyze_endpoint(body: SkillGapAnalyzeRequest):
    result = analyze_skill_gap(body.candidate_skills, body.target_role)
    return SkillGapAnalyzeResponse(**result)
