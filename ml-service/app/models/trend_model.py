"""
Emerging trend detection: BERTopic over the synthetic job-posting corpus
(sentence-transformer embeddings + UMAP + HDBSCAN under the hood), with a
simple topic-over-time growth calculation comparing the most recent third of
postings against the prior period.

New-topic flag rule (per architecture spec): docs >= 50 AND growth >= 40%
AND not already in the skill taxonomy -> routed to the employer validation
queue elsewhere; here we just compute the flag.

BERTopic needs a reasonable corpus size to form clusters; with too few
documents it degrades to a single "insufficient_data" topic rather than
crashing.
"""
import logging
from functools import lru_cache

import pandas as pd

from app.models.taxonomy_loader import all_canonical_skill_names
from app.store.feature_store import load_job_postings

logger = logging.getLogger(__name__)

MIN_DOCS_FOR_TOPIC_MODEL = 30
NEW_TOPIC_MIN_DOCS = 50
NEW_TOPIC_MIN_GROWTH_PCT = 40.0


# Job-ad boilerplate that would otherwise dominate every topic's keywords
_JOB_AD_WORDS = {
    "experience", "based", "skills", "skill", "required", "requirements", "role", "looking", "hiring",
    "join", "team", "candidate", "located", "location", "office", "position", "opportunity", "exciting",
    "plus", "strong", "bonus", "know", "knowledge", "familiarity", "preferred", "proficient", "hands",
    "comfortable", "learning", "job", "handson", "core", "company", "seeking", "talented", "related", "tools", "sector",
}


def _stop_words() -> list[str]:
    from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

    return sorted(ENGLISH_STOP_WORDS | _JOB_AD_WORDS)


_STOP_WORDS = _stop_words()


def _fit_topic_model(docs: list[str]):
    from bertopic import BERTopic
    from sklearn.feature_extraction.text import CountVectorizer

    vectorizer_model = CountVectorizer(stop_words=_STOP_WORDS, ngram_range=(1, 2), min_df=2)
    topic_model = BERTopic(
        vectorizer_model=vectorizer_model,
        calculate_probabilities=False,
        verbose=False,
        min_topic_size=max(3, len(docs) // 20),
    )
    topics, _ = topic_model.fit_transform(docs)
    return topic_model, topics


@lru_cache(maxsize=1)
def get_emerging_topics() -> dict:
    """Cached: BERTopic fit is expensive (~30s), and the synthetic corpus is
    static per process lifetime. Restart the service to pick up new data."""
    return _compute_emerging_topics()


def _compute_emerging_topics() -> dict:
    try:
        postings = load_job_postings()
    except FileNotFoundError:
        return {"topics": []}

    postings = postings.dropna(subset=["description"]).copy()
    if len(postings) < MIN_DOCS_FOR_TOPIC_MODEL:
        return {"topics": []}

    postings["date_posted"] = pd.to_datetime(postings["date_posted"])
    postings = postings.sort_values("date_posted")

    try:
        topic_model, topics = _fit_topic_model(postings["description"].tolist())
    except Exception as e:
        logger.warning("BERTopic fit failed: %s", e)
        return {"topics": []}

    postings = postings.reset_index(drop=True)
    postings["topic_id"] = topics

    cutoff_idx = int(len(postings) * (2 / 3))
    recent = postings.iloc[cutoff_idx:]
    prior = postings.iloc[:cutoff_idx]

    recent_counts = recent["topic_id"].value_counts()
    prior_counts = prior["topic_id"].value_counts()

    known_skills_lower = {s.lower() for s in all_canonical_skill_names()}

    topic_info = topic_model.get_topic_info()
    results = []
    for _, row in topic_info.iterrows():
        topic_id = int(row["Topic"])
        if topic_id == -1:
            continue  # BERTopic's outlier bucket
        doc_count = int(row["Count"])
        top_terms = [w for w, _ in (topic_model.get_topic(topic_id) or [])][:8]

        # Compare the topic's share of postings in each window, so unequal window
        # lengths and overall volume changes don't masquerade as topic growth.
        recent_share = recent_counts.get(topic_id, 0) / max(len(recent), 1)
        prior_share = prior_counts.get(topic_id, 0) / max(len(prior), 1)
        if prior_share == 0:
            growth_pct = 100.0 if recent_share > 0 else 0.0
        else:
            growth_pct = round(((recent_share - prior_share) / prior_share) * 100, 1)

        label = row.get("Name", f"topic_{topic_id}")
        in_taxonomy = any(term.lower() in known_skills_lower for term in top_terms)
        is_new = doc_count >= NEW_TOPIC_MIN_DOCS and growth_pct >= NEW_TOPIC_MIN_GROWTH_PCT and not in_taxonomy

        results.append(
            {
                "topic_id": topic_id,
                "label": label,
                "top_terms": top_terms,
                "doc_count": doc_count,
                "growth_pct": growth_pct,
                "is_new_topic_flag": bool(is_new),
            }
        )

    results.sort(key=lambda t: t["growth_pct"], reverse=True)
    return {"topics": results}
