"""Pydantic request/response models for every endpoint, with OpenAPI examples."""
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


# ---------- /ingest/record ----------
class IngestRecordRequest(BaseModel):
    source: str = Field(..., examples=["job_portal"])
    payload: dict = Field(..., examples=[{"title": "Software Developer", "description": "..."}])

    model_config = ConfigDict(json_schema_extra={
        "example": {"source": "job_portal", "payload": {"title": "Software Developer", "description": "Looking for a Python developer"}}
    })


class IngestRecordResponse(BaseModel):
    is_new: bool
    record_hash: str
    source: str

    model_config = ConfigDict(json_schema_extra={
        "example": {"is_new": True, "record_hash": "a1b2c3...", "source": "job_portal"}
    })


# ---------- /ner/extract ----------
class NERExtractRequest(BaseModel):
    text: str = Field(..., examples=["Looking for a Python developer with AWS and Docker experience."])


class ExtractedEntity(BaseModel):
    text: str
    label: str
    start: int
    end: int
    source: str  # "gazetteer" | "transformer" | "ensemble"
    confidence: float


class NERExtractResponse(BaseModel):
    entities: list[ExtractedEntity]

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "entities": [
                {"text": "Python", "label": "SKILL", "start": 20, "end": 26, "source": "ensemble", "confidence": 0.97},
                {"text": "AWS", "label": "SKILL", "start": 32, "end": 35, "source": "gazetteer", "confidence": 0.9},
            ]
        }
    })


# ---------- /job-title/classify ----------
class JobTitleClassifyRequest(BaseModel):
    title_text: str = Field(..., examples=["Senior Python Backend Developer"])


class OccupationPrediction(BaseModel):
    occupation_code: str
    occupation_title: str
    confidence: float


class JobTitleClassifyResponse(BaseModel):
    predictions: list[OccupationPrediction]

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "predictions": [
                {"occupation_code": "NCO-2131.01", "occupation_title": "Software Developer", "confidence": 0.82},
                {"occupation_code": "NCO-2131.04", "occupation_title": "Full Stack Developer", "confidence": 0.11},
                {"occupation_code": "NCO-2131.09", "occupation_title": "Data Engineer", "confidence": 0.04},
            ]
        }
    })


# ---------- /skill/standardize ----------
class SkillStandardizeRequest(BaseModel):
    raw_skill: str = Field(..., examples=["reactjs"])


class SkillStandardizeResponse(BaseModel):
    raw_skill: str
    canonical_skill: Optional[str]
    similarity: float
    status: str  # "matched" | "needs_review"

    model_config = ConfigDict(json_schema_extra={
        "example": {"raw_skill": "reactjs", "canonical_skill": "React", "similarity": 0.93, "status": "matched"}
    })


# ---------- /forecast/demand ----------
class ForecastPoint(BaseModel):
    month: str
    predicted_openings: float
    lower_bound: float
    upper_bound: float


class HistoryPoint(BaseModel):
    month: str
    openings: float


class ForecastResponse(BaseModel):
    role_title: Optional[str] = None
    skill: Optional[str] = None
    location: Optional[str] = None
    method: str  # "lightgbm_global" | "prophet_fallback" | "insufficient_data"
    history: list[HistoryPoint] = []
    forecast: list[ForecastPoint]

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "role_title": "Software Developer", "skill": "Python", "location": "Pune",
            "method": "lightgbm_global",
            "forecast": [
                {"month": "2026-10-01", "predicted_openings": 24.5, "lower_bound": 19.0, "upper_bound": 30.0}
            ],
        }
    })


# ---------- /skill-gap/analyze ----------
class SkillGapAnalyzeRequest(BaseModel):
    candidate_skills: list[str] = Field(..., examples=[["Python", "SQL"]])
    target_role: str = Field(..., examples=["Data Scientist"])


class SkillGapItem(BaseModel):
    required_skill: str
    best_match_candidate_skill: Optional[str]
    gap_score: float  # 0 = fully covered, 1 = fully missing
    rerank_score: float


class SkillGapAnalyzeResponse(BaseModel):
    target_role: str
    gaps: list[SkillGapItem]

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "target_role": "Data Scientist",
            "gaps": [
                {"required_skill": "Machine Learning", "best_match_candidate_skill": None, "gap_score": 1.0, "rerank_score": 0.02},
                {"required_skill": "SQL", "best_match_candidate_skill": "SQL", "gap_score": 0.0, "rerank_score": 0.98},
            ],
        }
    })


# ---------- /trend/emerging ----------
class TrendTopic(BaseModel):
    topic_id: int
    label: str
    top_terms: list[str]
    doc_count: int
    growth_pct: float
    is_new_topic_flag: bool


class TrendEmergingResponse(BaseModel):
    topics: list[TrendTopic]

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "topics": [
                {"topic_id": 3, "label": "cloud_kubernetes_devops", "top_terms": ["kubernetes", "docker", "aws"], "doc_count": 62, "growth_pct": 45.2, "is_new_topic_flag": True}
            ]
        }
    })


# ---------- /oversupply/check ----------
class OversupplyCheckResponse(BaseModel):
    course_id: str
    oversupply_probability: float
    label: str  # "oversupplied" | "balanced"
    top_reasons: list[dict]

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "course_id": "CRS-0007",
            "oversupply_probability": 0.81,
            "label": "oversupplied",
            "top_reasons": [
                {"feature": "enrollment_capacity_ratio", "shap_value": 0.34},
                {"feature": "placement_rate", "shap_value": 0.28},
            ],
        }
    })


# ---------- /curriculum/recommend ----------
class CurriculumRecommendation(BaseModel):
    course_id: Optional[str]
    course_name: str
    rank_score: float
    rationale: str


class CurriculumRecommendResponse(BaseModel):
    role_title: str
    location: Optional[str]
    recommendations: list[CurriculumRecommendation]

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "role_title": "Data Scientist", "location": "Pune",
            "recommendations": [
                {"course_id": "CRS-0012", "course_name": "Data Scientist Certification Program", "rank_score": 0.91, "rationale": "High forecast demand and existing skill-gap coverage"}
            ],
        }
    })


# ---------- /district-plan/optimize ----------
class DistrictPlanRequest(BaseModel):
    district: str = Field(..., examples=["Pune"])
    budget: float = Field(..., examples=[1000000])
    max_courses: int = Field(10, examples=[5])


class PlannedCourse(BaseModel):
    course_id: str
    course_name: str
    seats_funded: int
    cost: float
    expected_demand_score: float


class DistrictPlanResponse(BaseModel):
    district: str
    total_cost: float
    plan: list[PlannedCourse]
    status: str

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "district": "Pune", "total_cost": 950000.0, "status": "Optimal",
            "plan": [{"course_id": "CRS-0012", "course_name": "Data Scientist Certification Program", "seats_funded": 40, "cost": 400000.0, "expected_demand_score": 0.87}],
        }
    })


# ---------- /career-path/{skill_or_role} ----------
class CareerPathStep(BaseModel):
    node: str
    node_type: str  # "skill" | "role"
    pagerank_score: float
    relation: str


class CareerPathResponse(BaseModel):
    query: str
    resolved_node: Optional[str] = None
    next_steps: list[CareerPathStep]

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "query": "Python",
            "next_steps": [
                {"node": "Machine Learning", "node_type": "skill", "pagerank_score": 0.041, "relation": "commonly_paired_skill"},
                {"node": "Data Scientist", "node_type": "role", "pagerank_score": 0.038, "relation": "leads_to_role"},
            ],
        }
    })


# ---------- /meta/options ----------
class CourseOption(BaseModel):
    course_id: str
    course_name: str
    district: str
    sector: str


class ForecastSeriesOption(BaseModel):
    role_title: str
    skill: str
    location: str


class MetaOptionsResponse(BaseModel):
    roles: list[str]
    skills: list[str]
    districts: list[str]
    courses: list[CourseOption]
    forecast_series: list[ForecastSeriesOption]


# ---------- legacy simple integration (backend's aiService.js) ----------
class AnalyzeJobRequest(BaseModel):
    description: str = Field(..., examples=["Looking for a React developer with Node.js experience"])


class AnalyzeJobResponse(BaseModel):
    skills: list[str]

    model_config = ConfigDict(json_schema_extra={
        "example": {"skills": ["React", "Node.js"]}
    })
