import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    career_path,
    curriculum,
    district_plan,
    forecast,
    ingest,
    job_title,
    legacy,
    meta,
    ner,
    oversupply,
    skill_gap,
    skill_match,
    trend,
)

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="SIH PS-134 Labour Market Intelligence -- ML Service",
    description=(
        "Standalone AI/ML layer for skill-gap analysis, demand forecasting, "
        "curriculum recommendation, oversupply detection, emerging-trend "
        "alerts, district training plans, and career pathways. See README.md "
        "for setup, assumptions, and the backend integration contract."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # prototype only; the Node backend calls this service server-to-server
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    ingest.router,
    ner.router,
    job_title.router,
    skill_match.router,
    forecast.router,
    skill_gap.router,
    trend.router,
    oversupply.router,
    curriculum.router,
    district_plan.router,
    career_path.router,
    legacy.router,
    meta.router,
):
    app.include_router(router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
