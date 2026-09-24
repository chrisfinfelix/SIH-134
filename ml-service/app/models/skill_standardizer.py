"""
Skill standardization: Sentence-BERT bi-encoder (all-MiniLM-L6-v2) cosine
similarity against the canonical skill taxonomy. Threshold 0.75 per the
architecture spec -- below that, the raw phrase is routed to the employer
validation queue rather than auto-mapped.
"""
import logging
from functools import lru_cache

import numpy as np

from app.models.taxonomy_loader import load_skills

logger = logging.getLogger(__name__)

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
MATCH_THRESHOLD = 0.75


@lru_cache(maxsize=1)
def _get_encoder():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(MODEL_NAME)


@lru_cache(maxsize=1)
def _get_taxonomy_embeddings():
    skills = load_skills()
    names = [s["canonical_name"] for s in skills]
    try:
        encoder = _get_encoder()
        embeddings = encoder.encode(names, normalize_embeddings=True)
        return names, np.asarray(embeddings)
    except Exception as e:
        logger.warning("Bi-encoder unavailable for skill standardization: %s", e)
        return names, None


def standardize_skill(raw_skill: str) -> dict:
    names, embeddings = _get_taxonomy_embeddings()

    # exact / case-insensitive match short-circuit
    lower_map = {n.lower(): n for n in names}
    if raw_skill.strip().lower() in lower_map:
        return {
            "raw_skill": raw_skill,
            "canonical_skill": lower_map[raw_skill.strip().lower()],
            "similarity": 1.0,
            "status": "matched",
        }

    if embeddings is None:
        return {"raw_skill": raw_skill, "canonical_skill": None, "similarity": 0.0, "status": "needs_review"}

    try:
        encoder = _get_encoder()
        query_emb = encoder.encode([raw_skill], normalize_embeddings=True)[0]
        sims = embeddings @ query_emb
        best_idx = int(np.argmax(sims))
        best_sim = float(sims[best_idx])
    except Exception as e:
        logger.warning("Bi-encoder inference failed: %s", e)
        return {"raw_skill": raw_skill, "canonical_skill": None, "similarity": 0.0, "status": "needs_review"}

    if best_sim >= MATCH_THRESHOLD:
        return {
            "raw_skill": raw_skill,
            "canonical_skill": names[best_idx],
            "similarity": round(best_sim, 4),
            "status": "matched",
        }
    return {
        "raw_skill": raw_skill,
        "canonical_skill": None,
        "similarity": round(best_sim, 4),
        "status": "needs_review",
    }
