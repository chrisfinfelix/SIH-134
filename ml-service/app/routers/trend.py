from fastapi import APIRouter

from app.models.trend_model import get_emerging_topics
from app.schemas.schemas import TrendEmergingResponse

router = APIRouter(prefix="/trend", tags=["trend"])


@router.get("/emerging", response_model=TrendEmergingResponse)
def emerging_endpoint():
    result = get_emerging_topics()
    return TrendEmergingResponse(**result)
