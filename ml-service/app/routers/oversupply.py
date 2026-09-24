from fastapi import APIRouter, Query

from app.models.oversupply_model import check_oversupply
from app.schemas.schemas import OversupplyCheckResponse

router = APIRouter(prefix="/oversupply", tags=["oversupply"])


@router.get("/check", response_model=OversupplyCheckResponse)
def check_endpoint(course_id: str = Query(..., description="Course ID, e.g. 'CRS-0007'")):
    result = check_oversupply(course_id)
    return OversupplyCheckResponse(**result)
