"""
Smoke tests for every endpoint: asserts a 200 with the expected response
shape and that the service degrades gracefully (never 500s) on edge-case
input like unknown roles/skills/courses.
"""
import uuid


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_ingest_dedup(client):
    # Unique per run: the dedup store persists across test sessions
    payload = {"source": "job_portal", "payload": {"title": "Test Job", "description": str(uuid.uuid4())}}
    r1 = client.post("/ingest/record", json=payload)
    r2 = client.post("/ingest/record", json=payload)
    assert r1.status_code == 200 and r2.status_code == 200
    assert r1.json()["is_new"] is True
    assert r2.json()["is_new"] is False
    assert r1.json()["record_hash"] == r2.json()["record_hash"]


def test_ner_extract(client):
    r = client.post("/ner/extract", json={"text": "Looking for a Python developer with AWS experience."})
    assert r.status_code == 200
    entities = r.json()["entities"]
    assert any(e["text"].lower() == "python" for e in entities)


def test_ner_extract_empty_text(client):
    r = client.post("/ner/extract", json={"text": ""})
    assert r.status_code == 200
    assert r.json()["entities"] == []


def test_job_title_classify(client):
    r = client.post("/job-title/classify", json={"title_text": "Senior Python Backend Developer"})
    assert r.status_code == 200
    predictions = r.json()["predictions"]
    assert 1 <= len(predictions) <= 3
    assert all("occupation_code" in p and "confidence" in p for p in predictions)


def test_skill_standardize_known(client):
    r = client.post("/skill/standardize", json={"raw_skill": "reactjs"})
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "matched"
    assert body["canonical_skill"] == "React"


def test_skill_standardize_unknown(client):
    r = client.post("/skill/standardize", json={"raw_skill": "zzz_totally_unknown_zzz"})
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "needs_review"
    assert body["canonical_skill"] is None


def test_forecast_demand_unknown_series_degrades(client):
    r = client.get("/forecast/demand", params={"role": "Nonexistent Role"})
    assert r.status_code == 200
    body = r.json()
    assert body["method"] == "insufficient_data"
    assert body["forecast"] == []


def test_skill_gap_analyze(client):
    r = client.post(
        "/skill-gap/analyze", json={"candidate_skills": ["Python", "SQL"], "target_role": "Data Scientist"}
    )
    assert r.status_code == 200
    gaps = r.json()["gaps"]
    assert len(gaps) > 0
    covered = {g["required_skill"]: g for g in gaps}
    assert covered["Python"]["gap_score"] < 0.5


def test_skill_gap_unknown_role_degrades(client):
    r = client.post("/skill-gap/analyze", json={"candidate_skills": ["Python"], "target_role": "Not A Real Role"})
    assert r.status_code == 200
    assert r.json()["gaps"] == []


def test_curriculum_recommend(client):
    r = client.get("/curriculum/recommend", params={"role": "Data Scientist"})
    assert r.status_code == 200
    assert isinstance(r.json()["recommendations"], list)


def test_district_plan_optimize(client):
    r = client.post("/district-plan/optimize", json={"district": "Pune", "budget": 500000, "max_courses": 5})
    assert r.status_code == 200
    body = r.json()
    assert body["total_cost"] <= 500000 + 1e-6


def test_district_plan_unknown_district_degrades(client):
    r = client.post("/district-plan/optimize", json={"district": "Nowhereville", "budget": 500000})
    assert r.status_code == 200
    assert r.json()["status"] == "no_courses_in_district"


def test_career_path(client):
    r = client.get("/career-path/Python")
    assert r.status_code == 200
    assert isinstance(r.json()["next_steps"], list)


def test_career_path_unknown_node_degrades(client):
    r = client.get("/career-path/NotARealSkillOrRole")
    assert r.status_code == 200
    assert r.json()["next_steps"] == []


def test_legacy_analyze_job(client):
    r = client.post("/analyze-job", json={"description": "Looking for a React developer with Node.js experience"})
    assert r.status_code == 200
    skills = r.json()["skills"]
    assert "React" in skills or "Node.js" in skills


def test_oversupply_check_unknown_course_degrades(client):
    r = client.get("/oversupply/check", params={"course_id": "CRS-NOPE"})
    assert r.status_code == 200
    assert r.json()["label"] == "unknown_course"
