from fastapi import APIRouter

from app.models.job_title_model import classify_job_title
from app.schemas.schemas import JobTitleClassifyRequest, JobTitleClassifyResponse

router = APIRouter(prefix="/job-title", tags=["job-title"])


@router.post("/classify", response_model=JobTitleClassifyResponse)
def classify_endpoint(body: JobTitleClassifyRequest):
    predictions = classify_job_title(body.title_text)
    return JobTitleClassifyResponse(predictions=predictions)
