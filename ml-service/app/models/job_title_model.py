"""
Job title -> occupation code classifier.

Primary path: fine-tuned distilbert-base-uncased sequence classifier trained
by training/train_job_title_classifier.py on synthetic (title -> occupation
code) pairs, loaded from training/checkpoints/job_title_classifier if present.

Fallback (phase 1 / no fine-tuned checkpoint yet): zero-shot via the same
sentence-embedding bi-encoder used for skill standardization, embedding the
input title and every occupation title, returning cosine-similarity ranked
top-3. This keeps the endpoint always answering something reasonable even
before training has run, per the "degrade gracefully" constraint.

Both paths return top-3 predictions with confidence, never a bare argmax.
"""
import logging
import os
from functools import lru_cache

import numpy as np

from app.models.taxonomy_loader import load_occupations

logger = logging.getLogger(__name__)

HERE = os.path.dirname(__file__)
FINE_TUNED_DIR = os.path.join(HERE, "..", "..", "training", "checkpoints", "job_title_classifier")


@lru_cache(maxsize=1)
def _try_load_fine_tuned():
    if not os.path.isdir(FINE_TUNED_DIR) or not os.listdir(FINE_TUNED_DIR):
        return None
    try:
        import json

        from transformers import AutoModelForSequenceClassification, AutoTokenizer

        tokenizer = AutoTokenizer.from_pretrained(FINE_TUNED_DIR)
        model = AutoModelForSequenceClassification.from_pretrained(FINE_TUNED_DIR)
        with open(os.path.join(FINE_TUNED_DIR, "label_map.json"), encoding="utf-8") as f:
            label_map = json.load(f)  # {"0": "NCO-2131.01", ...}
        return tokenizer, model, label_map
    except Exception as e:
        logger.warning("Could not load fine-tuned job-title classifier: %s", e)
        return None


@lru_cache(maxsize=1)
def _zero_shot_occupation_embeddings():
    from app.models.skill_standardizer import _get_encoder

    occs = load_occupations()
    titles = [o["title"] for o in occs]
    try:
        encoder = _get_encoder()
        embeddings = encoder.encode(titles, normalize_embeddings=True)
        return occs, np.asarray(embeddings)
    except Exception as e:
        logger.warning("Zero-shot job-title fallback unavailable: %s", e)
        return occs, None


def _softmax(x: np.ndarray) -> np.ndarray:
    e = np.exp(x - np.max(x))
    return e / e.sum()


def classify_job_title(title_text: str, top_k: int = 3) -> list[dict]:
    fine_tuned = _try_load_fine_tuned()
    if fine_tuned is not None:
        tokenizer, model, label_map = fine_tuned
        try:
            import torch

            inputs = tokenizer(title_text, return_tensors="pt", truncation=True, padding=True)
            with torch.no_grad():
                logits = model(**inputs).logits[0].numpy()
            probs = _softmax(logits)
            top_idx = np.argsort(-probs)[:top_k]
            occs = load_occupations()
            occ_by_code = {o["code"]: o for o in occs}
            out = []
            for i in top_idx:
                code = label_map[str(i)]
                occ = occ_by_code.get(code, {"code": code, "title": code})
                out.append(
                    {"occupation_code": code, "occupation_title": occ["title"], "confidence": round(float(probs[i]), 4)}
                )
            return out
        except Exception as e:
            logger.warning("Fine-tuned inference failed, falling back to zero-shot: %s", e)

    occs, embeddings = _zero_shot_occupation_embeddings()
    if embeddings is None:
        return [{"occupation_code": "UNKNOWN", "occupation_title": "insufficient_data", "confidence": 0.0}]

    from app.models.skill_standardizer import _get_encoder

    try:
        encoder = _get_encoder()
        query_emb = encoder.encode([title_text], normalize_embeddings=True)[0]
        sims = embeddings @ query_emb
        top_idx = np.argsort(-sims)[:top_k]
        probs = _softmax(sims[top_idx] * 10)  # sharpen cosine sims into a pseudo-confidence
        out = []
        for rank, i in enumerate(top_idx):
            occ = occs[i]
            out.append(
                {"occupation_code": occ["code"], "occupation_title": occ["title"], "confidence": round(float(probs[rank]), 4)}
            )
        return out
    except Exception as e:
        logger.warning("Zero-shot job title inference failed: %s", e)
        return [{"occupation_code": "UNKNOWN", "occupation_title": "insufficient_data", "confidence": 0.0}]
