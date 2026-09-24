"""
Legacy/simple integration point matching the backend's existing
`aiService.js` contract (POST /analyze-job { description } -> { skills }),
so the already-built backend works against this service with zero changes.
Internally just wraps the richer /ner/extract pipeline and returns unique
skill surface strings.
"""
from fastapi import APIRouter

from app.models.ner_model import extract_entities
from app.schemas.schemas import AnalyzeJobRequest, AnalyzeJobResponse

router = APIRouter(tags=["legacy"])


@router.post("/analyze-job", response_model=AnalyzeJobResponse)
def analyze_job_endpoint(body: AnalyzeJobRequest):
    entities = extract_entities(body.description)
    skills = []
    seen = set()
    for e in entities:
        if e["label"] != "SKILL":
            continue
        key = e["text"].lower()
        if key not in seen:
            seen.add(key)
            skills.append(e["text"])
    return AnalyzeJobResponse(skills=skills)
