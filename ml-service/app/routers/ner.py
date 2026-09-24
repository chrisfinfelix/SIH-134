from fastapi import APIRouter

from app.models.ner_model import extract_entities
from app.schemas.schemas import NERExtractRequest, NERExtractResponse

router = APIRouter(prefix="/ner", tags=["ner"])


@router.post("/extract", response_model=NERExtractResponse)
def extract_endpoint(body: NERExtractRequest):
    entities = extract_entities(body.text)
    return NERExtractResponse(entities=entities)
