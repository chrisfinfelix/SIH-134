"""Ingestion dedup: hash a record's payload, insert into the sqlite hash table."""
import hashlib
import json

from app.store.feature_store import upsert_ingested_hash


def _stable_hash(payload: dict) -> str:
    canonical = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def ingest_record(source: str, payload: dict) -> dict:
    record_hash = _stable_hash(payload)
    is_new = upsert_ingested_hash(record_hash, source)
    return {"is_new": is_new, "record_hash": record_hash, "source": source}
