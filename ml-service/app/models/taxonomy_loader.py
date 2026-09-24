"""Shared taxonomy loading (skills + occupations), cached in-process."""
import json
import os
from functools import lru_cache

HERE = os.path.dirname(__file__)
TAXONOMY_DIR = os.path.join(HERE, "..", "data", "taxonomy")


@lru_cache(maxsize=1)
def load_skills() -> list[dict]:
    path = os.path.join(TAXONOMY_DIR, "skills.json")
    if not os.path.exists(path):
        from app.data.taxonomy.build_taxonomy import build
        build(TAXONOMY_DIR)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def load_occupations() -> list[dict]:
    path = os.path.join(TAXONOMY_DIR, "occupations.json")
    if not os.path.exists(path):
        from app.data.taxonomy.build_taxonomy import build
        build(TAXONOMY_DIR)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def all_canonical_skill_names() -> list[str]:
    return [s["canonical_name"] for s in load_skills()]


def occupation_by_code(code: str) -> dict | None:
    for o in load_occupations():
        if o["code"] == code:
            return o
    return None
