# SIH PS-134 — ML Service

Standalone AI/ML layer for the Labour Market Intelligence & Curriculum
Alignment platform (SIH Problem Statement 134). A FastAPI service the
existing Node.js backend calls over REST. Runs fully on CPU, no GPU required.

Covers: NER skill/entity extraction, job-title classification, skill
standardization, demand forecasting, skill-gap analysis, emerging-trend
detection, oversupply detection, curriculum recommendation, district training
plan optimization, and career pathway recommendation — all trained/tested
against generated synthetic data since no real labour-market data exists yet.

---

## 1. Setup

```bash
cd ml-service
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

### Windows note: SSL certificate errors installing/downloading

If `pip install` or the first model download fails with
`CERTIFICATE_VERIFY_FAILED`, your machine has TLS-inspecting antivirus/proxy
software whose root certificate is trusted by Windows but not by Python's
bundled `certifi` CA list. Two fixes (already applied in this repo):

1. `pip install ... --trusted-host pypi.org --trusted-host files.pythonhosted.org`
   for the initial `pip install` if it fails.
2. `pip-system-certs` is in `requirements.txt` — it patches Python's SSL
   context to trust the Windows certificate store, which fixes downloads
   from `huggingface.co` too. It's a no-op on machines without this problem.

### Pre-downloading model checkpoints (for offline demo day)

The service downloads these Hugging Face checkpoints on first use and caches
them under `~/.cache/huggingface`. **Run once while online**, well before the
demo, so nothing needs network access on the day:

| Checkpoint | Used by |
|---|---|
| `dslim/bert-base-NER` | NER transformer arm (`app/models/ner_model.py`) |
| `sentence-transformers/all-MiniLM-L6-v2` | skill standardization + skill-gap retrieval + job-title zero-shot fallback |
| `cross-encoder/ms-marco-MiniLM-L-6-v2` | skill-gap reranking |
| `distilbert-base-uncased` | base checkpoint fine-tuned by `training/train_job_title_classifier.py` |

Trigger all four downloads and pre-train everything in one pass:

```bash
python app/data/synthetic/generate_all.py       # generates synthetic data (required first)
python training/train_forecast_model.py
python training/train_oversupply_model.py
python training/train_curriculum_ranker.py
python training/train_job_title_classifier.py   # downloads + fine-tunes distilbert, ~2-3 min CPU
python notebooks_or_scripts/demo_end_to_end.py  # exercises every module, downloads the rest
```

---

## 2. Running the service

```bash
uvicorn app.main:app --reload --port 8000
```

OpenAPI docs (every endpoint has a worked example): `http://localhost:8000/docs`

Health check: `GET /health`

---

## 3. Running tests

```bash
pytest tests/ -q
```

23 tests: smoke tests for every endpoint, including graceful-degradation paths
(unknown role/skill/course/district all return a 200 with an
"insufficient data" style response, never a 500).

---

## 4. Repo structure

```
ml-service/
  app/
    main.py                 FastAPI app, route registration
    routers/                 one file per endpoint group (thin: parse -> call model -> return)
    models/                  model loading + inference logic, one file per module
    features/                shared feature engineering (forecast, oversupply, curriculum)
    schemas/                 Pydantic request/response models with OpenAPI examples
    data/
      synthetic/              synthetic data generators (generate_all.py) + generated output (out/, gitignored)
      taxonomy/                skill taxonomy + occupation code seed data (build_taxonomy.py)
    store/                   feature_store.py: parquet reads + sqlite ingest-hash table
  training/                  one script per trainable model; writes to training/checkpoints/ (gitignored)
  notebooks_or_scripts/
    demo_end_to_end.py       runs one synthetic record through the whole pipeline, saves demo_output.json
  tests/                     pytest smoke tests against the FastAPI TestClient
  requirements.txt
```

---

## 5. Model choices (per architecture spec)

| Module | Model | Notes |
|---|---|---|
| NER | `dslim/bert-base-NER` ensembled with a spaCy `PhraseMatcher` gazetteer built from the skill taxonomy | Gazetteer wins on span conflicts; transformer fills in novel phrasing. Falls back to gazetteer-only if the transformer checkpoint isn't cached. |
| Job title classification | `distilbert-base-uncased` fine-tuned on synthetic (title -> occupation code) pairs | Falls back to zero-shot bi-encoder similarity against occupation titles if the fine-tuned checkpoint doesn't exist yet. Always returns top-3 with confidence. |
| Skill standardization | `sentence-transformers/all-MiniLM-L6-v2`, cosine similarity, threshold 0.75 | Below threshold -> `status: needs_review` (employer validation queue in the full architecture). |
| Demand forecasting | Global LightGBM regressor (lag + rolling + seasonality features) across all role x skill x location series | Prophet fallback for series with less history than the lag window needs (cold start). Queries spanning several series (e.g. a role across all districts) are forecast **per series and summed** — tree models can't extrapolate past the per-series target range they were trained on. Responses include the last 12 observed months (`history`) for charting. |
| Skill gap analysis | Bi-encoder (`all-MiniLM-L6-v2`) top-K retrieval + `cross-encoder/ms-marco-MiniLM-L-6-v2` rerank | Falls back to bi-encoder-only scores if the cross-encoder is unavailable. |
| Emerging trend detection | BERTopic (sentence-transformer embeddings + UMAP + HDBSCAN) over the synthetic job-posting corpus | Growth = change in the topic's **share** of postings between the recent third and the earlier two-thirds (normalises unequal window lengths). Job-ad boilerplate words are stop-listed. New-topic flag: `docs >= 50 AND growth >= 40% AND not in taxonomy`. Cached per-process (fit takes ~30s). |
| Oversupply detection | LightGBM binary classifier, weak-labeled from the rule (`enrollment/capacity > 3.0 AND placement < 0.4 AND trend < 0`) | SHAP `TreeExplainer` top-3 reasons returned instead of a bare flag. |
| Curriculum recommendation | `LGBMRanker` (lambdarank) over skill-overlap / demand / capacity features | Trained on weak relevance grades built from the same features (documented simplification — swap in real engagement data later). |
| District training plan optimizer | PuLP LP (CBC solver), falls back to a greedy heuristic if CBC is unavailable | Maximizes demand-weighted seats funded under a budget + max-course-count constraint. |
| Career pathway recommender | `networkx` skill/role graph + personalized PageRank | Graph built from the occupation taxonomy's `typical_skills` co-occurrence. Unknown nodes are resolved through the skill standardizer (e.g. "node js" → Node.js, returned as `resolved_node`); `?top_k=` controls result count (default 8). |

---

## 6. Assumptions & simplifications (read before reconciling with the real backend)

Since no real data or finalized backend contract existed at build time:

- **Synthetic data everywhere.** `app/data/synthetic/generate_all.py` generates all 6 data types
  (job postings, skill taxonomy, occupation codes, courses/syllabi, placement records, a 30-month
  demand time series with injected emerging/declining/oversupplied patterns), seeded for reproducibility.
  Swap these for real ingestion pipelines without touching the model/router code.
- **Taxonomy size.** ~110 canonical skills and 40 occupations across IT/Manufacturing/Healthcare/Retail —
  enough to exercise every module, far smaller than a real deployment's taxonomy.
- **Feature store.** Parquet files (falls back to CSV) read via `app/store/feature_store.py`, plus a small
  SQLite table for the ingest dedup-hash. Not a real feature store — swap the read/write functions in that
  one file for Feast/Postgres/whatever later.
- **`/ingest/record`** only dedups by content hash; it does not validate schema per source type.
- **District-plan cost model.** No real per-seat cost data exists, so `COST_PER_SEAT = INR 10,000` is a flat
  assumption across all courses (`app/models/district_plan_model.py`). Replace with a real per-course cost
  field once the backend exposes one.
- **Curriculum ranker relevance labels.** No real course-engagement/completion data exists, so the
  `LGBMRanker` is trained on weak relevance grades derived from skill-overlap + demand + capacity-headroom —
  the same features it ranks on. Its value today is learning how to *combine* those signals, not an
  independent judgment; swap in real engagement data as it becomes available.
- **Oversupply weak labels** come from the rule heuristic in the architecture spec, not real outcomes —
  same caveat as above.
- **Occupation matching by exact title string** in `skill_gap_model.py` and `curriculum_features.py` — a
  role name that doesn't exactly match a taxonomy entry returns an empty/degraded result rather than fuzzy
  matching. Fine for the prototype's fixed taxonomy; would need fuzzy/embedding matching against a live
  occupation database in production.
- **Every module degrades gracefully** rather than erroring: unknown role/skill/course/district all return
  a 200 with an explicit "insufficient data" / "needs review" / "unknown" response. See `tests/test_api.py`
  for the exact contract each endpoint guarantees on bad input.

## 7. Backend integration

`GET /meta/options` returns the valid roles, skills, districts, courses and forecastable series so UIs can offer dropdowns instead of free text.

The Node backend proxies all of this under `/api/insights/*` (role-checked and validated), so the browser never calls this service directly and it needs no auth or public exposure.

Two ways the Node backend can talk to this service:

1. **Legacy/minimal** — the backend's existing `src/services/aiService.js` already calls
   `POST /analyze-job { description }` -> `{ skills: [...] }`. This is implemented as-is
   (`app/routers/legacy.py`, thin wrapper over `/ner/extract`) so the backend works with **zero changes**,
   as long as `AI_SERVICE_URL` in the backend's `.env` points at this service (default `http://localhost:8000`).
2. **Full contract** — the 11 richer endpoints under `/ingest`, `/ner`, `/job-title`, `/skill`, `/forecast`,
   `/skill-gap`, `/trend`, `/oversupply`, `/curriculum`, `/district-plan`, `/career-path` (see `/docs` for
   full request/response shapes + examples). Wire these in as the backend's controllers grow to need them —
   nothing here assumes a specific backend framework beyond "calls a REST API".

## 8. Known limitations

- Tabular models (forecast, oversupply, curriculum ranker) are trained on ~40-600 synthetic rows —
  plausible demo behavior, not production accuracy. Retrain against real data via the scripts in `training/`.
- BERTopic needs a reasonably sized corpus to form clean clusters; with the default synthetic volume (~600
  postings) topics are coherent but coarse. Increase `n=` in `generate_job_postings()` for sharper topics.
- The job-title fine-tune trains on templated title variations of the same 40 occupations — good at
  recognizing paraphrases of those titles, not a general open-vocabulary classifier.
- No auth/rate-limiting on this service; it's meant to sit behind the backend, not be exposed directly.
