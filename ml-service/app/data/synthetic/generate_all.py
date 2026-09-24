"""
Synthetic data generators for the SIH PS-134 ML prototype.

Generates (all seeded, reproducible):
  1. Job postings (title, description text with embedded skill mentions, location, date, sector)
  2. Skill taxonomy (loaded from ../taxonomy, already built)
  3. Occupation codes (loaded from ../taxonomy, already built)
  4. Courses & syllabi (name, sector, skills taught, enrollment, seat capacity)
  5. Placement records (course -> placement rate)
  6. Time series of postings/openings per role x skill x location over 30 months,
     with seasonality + a few injected emerging/declining/oversupplied patterns.

Run as a script to write everything under ml-service/app/data/synthetic/out/*.parquet
(falls back to .csv if pyarrow/parquet engine is unavailable).
"""
import json
import os
import random
from datetime import date, timedelta

import numpy as np
import pandas as pd
from faker import Faker

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
fake = Faker()
Faker.seed(SEED)

HERE = os.path.dirname(__file__)
TAXONOMY_DIR = os.path.join(HERE, "..", "taxonomy")
OUT_DIR = os.path.join(HERE, "out")

DISTRICTS = [
    "Pune", "Nagpur", "Nashik", "Coimbatore", "Madurai", "Indore", "Bhopal",
    "Jaipur", "Lucknow", "Kanpur", "Patna", "Ranchi", "Bhubaneswar", "Guwahati",
    "Chandigarh", "Ludhiana",
]

PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced"]

DESC_TEMPLATES = [
    "We are hiring a {title} to join our {sector} team. Required skills: {skills}. "
    "Experience with {extra} is a strong plus. Location: {location}.",
    "Looking for a talented {title}. Must have hands-on experience in {skills}. "
    "Bonus if you also know {extra}. Based out of {location}.",
    "{sector} company seeking {title}. Candidate should be proficient in {skills} "
    "and comfortable learning {extra} on the job. Position based in {location}.",
    "Exciting opportunity for a {title} role. Core requirements: {skills}. "
    "Familiarity with {extra} preferred. Office located in {location}.",
]


def _load_taxonomy():
    with open(os.path.join(TAXONOMY_DIR, "skills.json"), encoding="utf-8") as f:
        skills = json.load(f)
    with open(os.path.join(TAXONOMY_DIR, "occupations.json"), encoding="utf-8") as f:
        occupations = json.load(f)
    return skills, occupations


def generate_job_postings(occupations, skills, n=600):
    skills_by_sector = {}
    for s in skills:
        skills_by_sector.setdefault(s["sector"], []).append(s)

    rows = []
    start = date.today() - timedelta(days=30 * 30)
    for i in range(n):
        occ = random.choice(occupations)
        sector = occ["sector"]
        core_skills = random.sample(
            occ["typical_skills"], k=min(len(occ["typical_skills"]), random.randint(2, 4))
        )
        pool = [s["canonical_name"] for s in skills_by_sector.get(sector, skills)]
        extra_pool = [s for s in pool if s not in core_skills]
        extra_skills = random.sample(extra_pool, k=min(2, len(extra_pool)))

        # occasionally inject a noisy synonym instead of the canonical name to
        # exercise the skill-standardization / gazetteer matcher downstream
        def maybe_noisy(name):
            for s in skills:
                if s["canonical_name"] == name and s["synonyms"] and random.random() < 0.35:
                    return random.choice(s["synonyms"])
            return name

        skills_text = ", ".join(maybe_noisy(s) for s in core_skills)
        extra_text = ", ".join(maybe_noisy(s) for s in extra_skills) if extra_skills else "related tools"
        location = random.choice(DISTRICTS)
        template = random.choice(DESC_TEMPLATES)
        description = template.format(
            title=occ["title"], sector=sector, skills=skills_text, extra=extra_text, location=location
        )
        posted_date = start + timedelta(days=random.randint(0, 30 * 30))
        rows.append(
            {
                "posting_id": f"JOB-{i:05d}",
                "title": occ["title"],
                "occupation_code": occ["code"],
                "sector": sector,
                "description": description,
                "location": location,
                "date_posted": posted_date.isoformat(),
                "skills_mentioned": core_skills + extra_skills,
            }
        )
    return pd.DataFrame(rows)


def generate_courses(occupations, skills, n=120):
    skills_by_sector = {}
    for s in skills:
        skills_by_sector.setdefault(s["sector"], []).append(s["canonical_name"])

    rows = []
    for i in range(n):
        occ = random.choice(occupations)
        sector = occ["sector"]
        pool = skills_by_sector.get(sector, [s["canonical_name"] for s in skills])
        taught = random.sample(pool, k=min(len(pool), random.randint(3, 6)))
        capacity = random.randint(20, 150)
        # inject a few oversupplied courses: enrollment >> capacity, low placement
        oversupplied = random.random() < 0.12
        if oversupplied:
            enrollment = int(capacity * random.uniform(3.2, 5.0))
        else:
            enrollment = int(capacity * random.uniform(0.4, 1.3))
        rows.append(
            {
                "course_id": f"CRS-{i:04d}",
                "course_name": f"{occ['title']} Certification Program",
                "sector": sector,
                "target_occupation_code": occ["code"],
                "skills_taught": taught,
                "seat_capacity": capacity,
                "enrollment": enrollment,
                "district": random.choice(DISTRICTS),
                "_synthetic_oversupplied": oversupplied,
            }
        )
    return pd.DataFrame(rows)


def generate_placements(courses_df):
    rows = []
    for _, c in courses_df.iterrows():
        ratio = c["enrollment"] / max(c["seat_capacity"], 1)
        if c["_synthetic_oversupplied"]:
            placement_rate = np.clip(np.random.normal(0.25, 0.08), 0.02, 0.55)
        else:
            base = np.clip(1.15 - 0.25 * ratio, 0.3, 0.95)
            placement_rate = np.clip(np.random.normal(base, 0.08), 0.05, 0.98)
        rows.append(
            {
                "course_id": c["course_id"],
                "placed_count": int(c["enrollment"] * placement_rate),
                "total_graduates": c["enrollment"],
                "placement_rate": round(float(placement_rate), 3),
                "avg_salary_inr": int(np.random.normal(360000, 90000)),
            }
        )
    return pd.DataFrame(rows)


def generate_time_series(occupations, skills, n_months=30):
    """Monthly postings/openings count per (role, skill, location).

    Injects:
      - baseline seasonality (festive/hiring-season bump)
      - a handful of 'emerging trend' series (strong upward growth, low history)
      - a handful of 'declining/oversupplied' series (downward trend)
    """
    months = pd.date_range(end=pd.Timestamp.today().normalize().replace(day=1), periods=n_months, freq="MS")

    skill_by_sector = {}
    for s in skills:
        skill_by_sector.setdefault(s["sector"], []).append(s["canonical_name"])

    series_keys = []
    for occ in occupations:
        sector_skills = skill_by_sector.get(occ["sector"], [])
        picked_skills = random.sample(sector_skills, k=min(3, len(sector_skills)))
        locations = random.sample(DISTRICTS, k=3)
        for sk in picked_skills:
            for loc in locations:
                series_keys.append((occ["code"], occ["title"], sk, loc))

    # tag a subset as emerging / declining for the demo
    random.shuffle(series_keys)
    n_emerging = 8
    n_declining = 8
    emerging_keys = set(series_keys[:n_emerging])
    declining_keys = set(series_keys[n_emerging:n_emerging + n_declining])

    rows = []
    for key in series_keys:
        occ_code, occ_title, skill, loc = key
        base = np.random.uniform(8, 40)
        seasonal_amp = base * 0.15
        trend_slope = np.random.uniform(-0.3, 0.3)

        if key in emerging_keys:
            trend_slope = np.random.uniform(1.2, 2.5)
            base = np.random.uniform(3, 10)  # low starting history -> cold start
            history_start = n_months - random.randint(6, 10)  # short history
        elif key in declining_keys:
            trend_slope = np.random.uniform(-2.0, -0.8)
            history_start = 0
        else:
            history_start = 0

        for t in range(n_months):
            if t < history_start:
                continue
            seasonal = seasonal_amp * np.sin(2 * np.pi * (t % 12) / 12.0)
            trend = trend_slope * (t - history_start)
            noise = np.random.normal(0, base * 0.1)
            value = max(0, base + trend + seasonal + noise)
            rows.append(
                {
                    "month": months[t].date().isoformat(),
                    "occupation_code": occ_code,
                    "role_title": occ_title,
                    "skill": skill,
                    "location": loc,
                    "openings": int(round(value)),
                    "_synthetic_emerging": key in emerging_keys,
                    "_synthetic_declining": key in declining_keys,
                }
            )
    return pd.DataFrame(rows)


def _save(df, name):
    os.makedirs(OUT_DIR, exist_ok=True)
    path_parquet = os.path.join(OUT_DIR, f"{name}.parquet")
    try:
        df.to_parquet(path_parquet, index=False)
        return path_parquet
    except Exception:
        path_csv = os.path.join(OUT_DIR, f"{name}.csv")
        df.to_csv(path_csv, index=False)
        return path_csv


def generate_and_save_all():
    skills, occupations = _load_taxonomy()

    postings = generate_job_postings(occupations, skills)
    courses = generate_courses(occupations, skills)
    placements = generate_placements(courses)
    timeseries = generate_time_series(occupations, skills)

    paths = {
        "job_postings": _save(postings, "job_postings"),
        "courses": _save(courses, "courses"),
        "placements": _save(placements, "placements"),
        "demand_timeseries": _save(timeseries, "demand_timeseries"),
    }
    return paths


if __name__ == "__main__":
    paths = generate_and_save_all()
    for name, path in paths.items():
        print(f"{name}: {path}")
