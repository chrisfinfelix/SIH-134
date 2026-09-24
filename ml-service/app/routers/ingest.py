from fastapi import APIRouter

from app.models.ingest_model import ingest_record
from app.schemas.schemas import IngestRecordRequest, IngestRecordResponse

router = APIRouter(prefix="/ingest", tags=["ingest"])


@router.post("/record", response_model=IngestRecordResponse)
def ingest_record_endpoint(body: IngestRecordRequest):
    result = ingest_record(body.source, body.payload)
    return IngestRecordResponse(**result)
