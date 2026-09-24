"""
Skill/entity NER: gazetteer (spaCy PhraseMatcher over the skill taxonomy,
including synonyms) ensembled with a pretrained transformer NER pipeline.

Ensemble rule (per the architecture diagram): gazetteer matches take priority
on span conflicts (higher precision on known vocabulary); transformer spans
fill in novel/unseen skill phrasing. Overlapping spans are deduped, gazetteer
wins ties.

Degrades gracefully: if the transformer model isn't downloaded/cached (no
internet at demo time and the checkpoint wasn't pre-fetched), falls back to
gazetteer-only extraction rather than crashing.
"""
import logging
from functools import lru_cache

from app.models.taxonomy_loader import load_skills

logger = logging.getLogger(__name__)

TRANSFORMER_MODEL_NAME = "dslim/bert-base-NER"


@lru_cache(maxsize=1)
def _get_spacy_matcher():
    import spacy
    from spacy.matcher import PhraseMatcher

    try:
        nlp = spacy.blank("en")
    except Exception:
        nlp = spacy.load("en_core_web_sm")

    matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
    skill_to_canonical = {}
    for s in load_skills():
        names = [s["canonical_name"]] + list(s.get("synonyms", []))
        patterns = [nlp.make_doc(n) for n in names]
        matcher.add(s["canonical_name"], patterns)
        for n in names:
            skill_to_canonical[n.lower()] = s["canonical_name"]
    return nlp, matcher, skill_to_canonical


@lru_cache(maxsize=1)
def _get_transformer_pipeline():
    try:
        from transformers import pipeline

        return pipeline(
            "ner",
            model=TRANSFORMER_MODEL_NAME,
            aggregation_strategy="simple",
        )
    except Exception as e:  # model not cached / no internet / not installed
        logger.warning("Transformer NER unavailable, falling back to gazetteer-only: %s", e)
        return None


def _gazetteer_spans(text: str):
    nlp, matcher, skill_to_canonical = _get_spacy_matcher()
    doc = nlp(text)
    matches = matcher(doc)
    spans = []
    for match_id, start, end in matches:
        span = doc[start:end]
        canonical = skill_to_canonical.get(span.text.lower(), span.text)
        spans.append(
            {
                "text": span.text,
                "label": "SKILL",
                "start": span.start_char,
                "end": span.end_char,
                "source": "gazetteer",
                "confidence": 0.9,
                "canonical": canonical,
            }
        )
    return spans


def _transformer_spans(text: str):
    nlp_pipe = _get_transformer_pipeline()
    if nlp_pipe is None:
        return []
    try:
        results = nlp_pipe(text)
    except Exception as e:
        logger.warning("Transformer NER inference failed: %s", e)
        return []
    spans = []
    for r in results:
        spans.append(
            {
                "text": r["word"],
                "label": r.get("entity_group", "ENT"),
                "start": int(r["start"]),
                "end": int(r["end"]),
                "source": "transformer",
                "confidence": float(r.get("score", 0.5)),
            }
        )
    return spans


def _overlaps(a, b) -> bool:
    return a["start"] < b["end"] and b["start"] < a["end"]


def extract_entities(text: str) -> list[dict]:
    gazetteer = _gazetteer_spans(text)
    transformer = _transformer_spans(text)

    merged = list(gazetteer)
    for t_span in transformer:
        if any(_overlaps(t_span, g_span) for g_span in gazetteer):
            continue  # gazetteer wins on conflict
        merged.append(t_span)

    merged.sort(key=lambda s: s["start"])
    for s in merged:
        s.pop("canonical", None)
    return merged
