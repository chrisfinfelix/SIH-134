"""
Skill gap analysis: two-stage retrieve & rerank.

Stage 1 (retrieve): bi-encoder (all-MiniLM-L6-v2, reused from
skill_standardizer) embeds the candidate's skills and the target role's
required skills, cosine-similarity retrieves the top-K candidate skills most
similar to each required skill.

Stage 2 (rerank): a cross-encoder scores each (required_skill, candidate_skill)
pair from the top-K directly (joint attention over both texts) for a more
precise match/gap score than cosine similarity alone.

gap_score = 1 - rerank_score for the best-matching candidate skill (0 = fully
covered, 1 = fully missing). If the candidate has no skills at all, or the
role isn't in the taxonomy, degrades to gap_score=1.0 for every required
skill rather than erroring.
"""
import logging
from functools import lru_cache

import numpy as np

from app.models.taxonomy_loader import load_occupations

logger = logging.getLogger(__name__)

CROSS_ENCODER_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"
TOP_K = 5


@lru_cache(maxsize=1)
def _get_cross_encoder():
    try:
        from sentence_transformers import CrossEncoder

        return CrossEncoder(CROSS_ENCODER_NAME)
    except Exception as e:
        logger.warning("Cross-encoder unavailable, reranking will fall back to bi-encoder scores: %s", e)
        return None


def _required_skills_for_role(target_role: str) -> list[str]:
    for occ in load_occupations():
        if occ["title"].strip().lower() == target_role.strip().lower():
            return occ["typical_skills"]
    return []


def analyze_skill_gap(candidate_skills: list[str], target_role: str) -> dict:
    required = _required_skills_for_role(target_role)
    if not required:
        return {"target_role": target_role, "gaps": []}

    if not candidate_skills:
        return {
            "target_role": target_role,
            "gaps": [
                {"required_skill": r, "best_match_candidate_skill": None, "gap_score": 1.0, "rerank_score": 0.0}
                for r in required
            ],
        }

    from app.models.skill_standardizer import _get_encoder

    try:
        encoder = _get_encoder()
        req_emb = encoder.encode(required, normalize_embeddings=True)
        cand_emb = encoder.encode(candidate_skills, normalize_embeddings=True)
        sims = np.asarray(req_emb) @ np.asarray(cand_emb).T  # (n_required, n_candidate)
    except Exception as e:
        logger.warning("Bi-encoder retrieval failed in skill-gap analysis: %s", e)
        return {
            "target_role": target_role,
            "gaps": [
                {"required_skill": r, "best_match_candidate_skill": None, "gap_score": 1.0, "rerank_score": 0.0}
                for r in required
            ],
        }

    cross_encoder = _get_cross_encoder()
    gaps = []
    for i, req_skill in enumerate(required):
        top_k_idx = np.argsort(-sims[i])[:TOP_K]
        candidates_subset = [candidate_skills[j] for j in top_k_idx]

        if cross_encoder is not None:
            try:
                pairs = [[req_skill, c] for c in candidates_subset]
                scores = cross_encoder.predict(pairs)
                scores = 1 / (1 + np.exp(-np.asarray(scores)))  # sigmoid to [0,1]
            except Exception as e:
                logger.warning("Cross-encoder rerank failed, using bi-encoder scores: %s", e)
                scores = sims[i][top_k_idx]
        else:
            scores = sims[i][top_k_idx]

        best_local = int(np.argmax(scores))
        best_score = float(scores[best_local])
        best_skill = candidates_subset[best_local]

        gaps.append(
            {
                "required_skill": req_skill,
                "best_match_candidate_skill": best_skill if best_score > 0.3 else None,
                "gap_score": round(max(0.0, 1.0 - best_score), 4),
                "rerank_score": round(best_score, 4),
            }
        )
    return {"target_role": target_role, "gaps": gaps}
