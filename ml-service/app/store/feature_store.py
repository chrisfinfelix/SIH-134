"""
Minimal "feature store" for the prototype: reads/writes parquet (falling back
to CSV) under app/data/synthetic/out/ and app/store/db/. Not a real feature
store -- just enough structure that swapping in a real one later (e.g. Feast,
a Postgres table) only touches this file.
"""
import os
import sqlite3

import pandas as pd

HERE = os.path.dirname(__file__)
SYNTH_OUT = os.path.join(HERE, "..", "data", "synthetic", "out")
DB_DIR = os.path.join(HERE, "db")
SQLITE_PATH = os.path.join(DB_DIR, "feature_store.sqlite")

os.makedirs(DB_DIR, exist_ok=True)


def _read_any(name: str) -> pd.DataFrame:
    parquet_path = os.path.join(SYNTH_OUT, f"{name}.parquet")
    csv_path = os.path.join(SYNTH_OUT, f"{name}.csv")
    if os.path.exists(parquet_path):
        return pd.read_parquet(parquet_path)
    if os.path.exists(csv_path):
        return pd.read_csv(csv_path)
    raise FileNotFoundError(
        f"No synthetic data found for '{name}'. Run "
        f"`python app/data/synthetic/generate_all.py` first."
    )


def load_job_postings() -> pd.DataFrame:
    return _read_any("job_postings")


def load_courses() -> pd.DataFrame:
    return _read_any("courses")


def load_placements() -> pd.DataFrame:
    return _read_any("placements")


def load_demand_timeseries() -> pd.DataFrame:
    return _read_any("demand_timeseries")


def get_sqlite_conn() -> sqlite3.Connection:
    return sqlite3.connect(SQLITE_PATH)


def upsert_ingested_hash(record_hash: str, source: str) -> bool:
    """Returns True if the record is new (inserted), False if it was a duplicate."""
    conn = get_sqlite_conn()
    try:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS ingested_hashes "
            "(hash TEXT PRIMARY KEY, source TEXT, seen_at TEXT DEFAULT CURRENT_TIMESTAMP)"
        )
        try:
            conn.execute(
                "INSERT INTO ingested_hashes (hash, source) VALUES (?, ?)", (record_hash, source)
            )
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False
    finally:
        conn.close()
