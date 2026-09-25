# SIH26134 – Labour Market Intelligence & Curriculum Alignment Platform

> Smart India Hackathon 2026 prototype (Problem Statement 134).
> Connects job market demand to training courses, identifies skill gaps, and
> recommends how curricula should change to match industry needs.

This is a monorepo with three independent services:

| Service | Folder | Stack | Default port |
|---|---|---|---|
| Frontend | `jobify-frontend/` | React + Vite + Chakra UI | `3003` |
| Backend API | `backend/` | Node.js + Express + MongoDB Atlas | `5000` |
| ML service | `ml-service/` | Python + FastAPI (NER, forecasting, ranking, etc.) | `8000` |

The frontend only ever talks to the backend. The backend is the only thing
that talks to the ML service. Nothing calls the ML service directly from the
browser.

```
Browser  ──▶  jobify-frontend (Vite, :3003)
                   │  /api/* proxied to backend
                   ▼
             backend (Express, :5000)  ──▶  MongoDB Atlas
                   │  AI_SERVICE_URL
                   ▼
             ml-service (FastAPI, :8000)
```

---

## Prerequisites

- Node.js ≥ 18 and npm
- Python 3.10+ (for `ml-service`)
- A MongoDB Atlas cluster (free M0 tier is fine) — see [MongoDB Atlas Setup](#mongodb-atlas-setup)
- Optional: Docker + Docker Compose, if you'd rather run everything in containers

---

## Quick start (local, three terminals)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGODB_URI, JWT_SECRET (see below)
npm run dev
```

Runs on `http://localhost:5000`. Health check: `GET /api/health`.

Seed demo data (skills, jobs, courses, a default admin) once:

```bash
npm run seed
```

### 2. ML service

```bash
cd ml-service
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Generate synthetic data and train the models (only needed once — the trained
checkpoints and generated data are cached on disk afterward):

```bash
python app/data/synthetic/generate_all.py
python training/train_forecast_model.py
python training/train_oversupply_model.py
python training/train_curriculum_ranker.py
python training/train_job_title_classifier.py
```

Then run the service:

```bash
uvicorn app.main:app --reload --port 8000
```

Runs on `http://localhost:8000`. Interactive API docs (every endpoint has a
worked example): `http://localhost:8000/docs`. Health check: `GET /health`.

If the ML service is offline, the backend degrades gracefully (returns an
empty skill array / "insufficient data" style responses) instead of failing.

### 3. Frontend

```bash
cd jobify-frontend
npm install
npm run dev
```

Runs on `http://localhost:3003`. Vite's dev server proxies `/api/*` requests
to `http://localhost:5000` (see `vite.config.js`), so the frontend needs no
extra config to reach the backend locally.

Open **http://localhost:3003** in your browser.

---

## Test credentials (development seed data)

| Role | Email | Password |
|---|---|---|
| Admin | admin@jobify.gov.in | Admin@123 |
| Employer | employer@techcorp.in | Employer@123 |
| Trainee | trainee@domain.in | Trainee@123 |

> ⚠️ These are demo-only credentials seeded by `npm run seed`. Change/remove
> them before any real deployment.

---

## MongoDB Atlas Setup

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster (M0)
3. Create a database user (username + password)
4. Under Network Access → Add IP Address → Allow from anywhere (`0.0.0.0/0`) for development
5. Click Connect → Drivers → copy the connection string
6. Replace `<password>` in the string with your database user's password
7. Paste it as `MONGODB_URI` in `backend/.env`

---

## Environment Variables

### `backend/.env`

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/sih26134?retryWrites=true&w=majority
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3003
AI_SERVICE_URL=http://localhost:8000
```

### `jobify-frontend/.env.local`

```env
VITE_API_URL=/api
```

Left as a relative path so it works both with the Vite dev proxy locally and
behind the same-origin nginx/Vercel rewrite in production.

The ML service has no required env vars for local/dev use (`PYTHONUNBUFFERED=1`
is set only in Docker, purely for log flushing).

---

## Running everything with Docker Compose

```bash
docker compose up --build
```

This builds and runs all three services together:

- `ml-service` → `http://localhost:8000` (backend waits for its healthcheck before starting)
- `backend` → `http://localhost:5000` (reads `backend/.env` via `env_file`)
- `frontend` → `http://localhost:3003` (built and served via nginx on container port 80)

Make sure `backend/.env` exists (with a valid `MONGODB_URI` and `JWT_SECRET`)
before running this — it's mounted in via `env_file` in `docker-compose.yml`.

---

## Repo layout

```
.
├── backend/                       Express API
│   ├── src/
│   │   ├── config/db.js           MongoDB Atlas connection
│   │   ├── models/                Mongoose models
│   │   ├── controllers/           Request handlers
│   │   ├── routes/                Express routers
│   │   ├── middleware/            auth, role, error, notFound
│   │   ├── services/              aiService.js (calls ml-service), recommendationService.js
│   │   ├── utils/generateToken.js JWT helper
│   │   └── app.js                 Express entry point
│   ├── scripts/seed.js            Data seeding script
│   ├── data/                      Mock JSON seed data
│   └── .env.example
│
├── jobify-frontend/                React + Vite client
│   ├── src/                        Components, pages, routes
│   ├── public/
│   └── vite.config.js              Dev server + /api proxy config
│
├── ml-service/                     FastAPI AI/ML layer
│   ├── app/
│   │   ├── main.py                 FastAPI app, route registration
│   │   ├── routers/                One file per endpoint group
│   │   ├── models/                 Model loading + inference logic
│   │   ├── features/               Shared feature engineering
│   │   ├── schemas/                Pydantic request/response models
│   │   ├── data/synthetic/         Synthetic data generators
│   │   └── store/                  Parquet/SQLite feature store
│   ├── training/                   One script per trainable model
│   ├── notebooks_or_scripts/       demo_end_to_end.py — exercises every module
│   ├── tests/                      Pytest smoke tests
│   └── requirements.txt
│
└── docker-compose.yml               Runs all three services together
```

---

## Backend API reference

All protected endpoints require:

```
Authorization: Bearer <jwt_token>
```

Get a token via `POST /api/auth/login`.

| Role | Access |
|---|---|
| `admin` | Full access including admin endpoints |
| `employer` | Employer endpoints (validate, demand signal) |
| `trainee` | Public endpoints + trainee pathway |

| Method | Route | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | /api/health | No | - | Health check |
| POST | /api/auth/register | No | - | Register new user |
| POST | /api/auth/login | No | - | Login, receive JWT |
| GET | /api/auth/me | Yes | Any | Get current user |
| GET | /api/jobs | No | - | List jobs (filterable) |
| GET | /api/jobs/:id | No | - | Single job |
| POST | /api/jobs | Yes | admin | Create job |
| POST | /api/jobs/bulk | Yes | admin | Bulk import jobs |
| GET | /api/skills | No | - | List all skills |
| GET | /api/skills/demand | No | - | Skill demand from jobs |
| GET | /api/skills/:id | No | - | Single skill |
| GET | /api/courses | No | - | List courses with gap info |
| GET | /api/courses/:id | No | - | Course detail + gap + rec |
| GET | /api/districts | No | - | List districts |
| GET | /api/districts/:name/plan | No | - | District plan |
| POST | /api/employer/validate | Yes | employer | Validate a course |
| GET | /api/employer/validations | Yes | employer | My validations |
| POST | /api/employer/demand-signal | Yes | employer | Submit demand signal |
| GET | /api/employer/demand-signals | Yes | employer | My demand signals |
| GET | /api/trainee/pathways | No | - | Ranked course pathways |
| GET | /api/admin/stats | Yes | admin | Dashboard statistics |
| GET | /api/admin/skill-demand | Yes | admin | Top skill demand |
| GET | /api/admin/district-summary | Yes | admin | District job/course counts |
| GET | /api/admin/recommendations | Yes | admin | Courses needing updates |

All successful responses follow `{ "success": true, "data": ... }`.
All errors follow `{ "success": false, "message": "..." }`.

### Example: register

```
POST /api/auth/register
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "role": "trainee"
}
```

```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": { "_id": "...", "name": "Jane Doe", "role": "trainee" }
  }
}
```

### Example: get courses (with filters)

```
GET /api/courses?district=Ernakulam&flag=Needs%20Update&page=1&limit=10
```

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "courseName": "Full Stack Web Development",
      "district": "Ernakulam",
      "gapScore": 42,
      "flag": "Needs Update",
      "missingSkills": ["AWS", "Docker", "MongoDB"],
      "recommendation": {
        "text": "Add AWS fundamentals and Docker modules.",
        "suggestedSkills": ["AWS", "Docker", "MongoDB"]
      }
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "pages": 1 }
}
```

### Example: trainee pathways

```
GET /api/trainee/pathways?targetRole=Full%20Stack%20Developer
```

```json
{
  "success": true,
  "data": {
    "targetRole": "Full Stack Developer",
    "requiredSkills": ["React", "Node.js", "MongoDB", "AWS"],
    "totalJobsFound": 4,
    "courses": [
      {
        "courseId": "...",
        "courseName": "Full Stack Web Development",
        "matchPercentage": 75,
        "matchedSkills": ["React", "Node.js"],
        "missingSkills": ["MongoDB", "AWS"]
      }
    ]
  }
}
```

### Example: skill demand

```
GET /api/skills/demand
```

```json
{
  "success": true,
  "data": {
    "skills": [
      { "skill": "React", "jobCount": 8, "percentage": 40 },
      { "skill": "Python", "jobCount": 6, "percentage": 30 }
    ],
    "totalJobs": 20
  }
}
```

---

## AI/ML integration

`ml-service` covers: NER skill/entity extraction, job-title classification,
skill standardization, demand forecasting, skill-gap analysis, emerging-trend
detection, oversupply detection, curriculum recommendation, district training
plan optimization, and career pathway recommendation. All trained on
synthetic data (no real labour-market data exists yet) and runs entirely on
CPU — no GPU required.

Two ways the backend talks to it:

1. **Legacy/minimal** — `backend/src/services/aiService.js` calls
   `POST /analyze-job { description }` → `{ skills: [...] }`. Works with zero
   backend changes as long as `AI_SERVICE_URL` points at the ML service.
2. **Full contract** — 11 richer endpoints under `/ingest`, `/ner`,
   `/job-title`, `/skill`, `/forecast`, `/skill-gap`, `/trend`, `/oversupply`,
   `/curriculum`, `/district-plan`, `/career-path`. Full request/response
   shapes and worked examples are in `http://localhost:8000/docs`.
   `GET /meta/options` returns valid roles/skills/districts/courses for UI
   dropdowns.

See `ml-service/README.md` for the full model-choice table (which
Hugging Face checkpoint / library backs each module) and known limitations.

### Running ML service tests

```bash
cd ml-service
pytest tests/ -q
```

23 smoke tests covering every endpoint, including graceful-degradation paths
(unknown role/skill/course/district return 200 with an "insufficient data"
style response, never a 500).

---

## Deployment

### Backend → Render

1. Push the `backend/` directory to a GitHub repo
2. Go to [https://render.com](https://render.com) → New → Web Service
3. Connect your repo
4. Build command: `npm install` · Start command: `npm start`
5. Set environment variables: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`
   (your deployed frontend URL), `AI_SERVICE_URL`, `NODE_ENV=production`

Render auto-assigns a port; the server reads `process.env.PORT` automatically.

### Frontend → Vercel

`jobify-frontend/vercel.json` handles SPA client-side routing rewrites.
Set `VITE_API_URL` in the Vercel project's environment variables if the API
isn't served from the same origin.

### All services → Docker

See [Running everything with Docker Compose](#running-everything-with-docker-compose)
above. Each service also has a standalone `Dockerfile` if you want to deploy
them independently (e.g. ML service on its own container host).

---

## Troubleshooting

| Error | Fix |
|---|---|
| `MongoServerError: bad auth` | Check `MONGODB_URI` username/password in `backend/.env` |
| `Network Error` from the frontend | Check `CLIENT_URL` in `backend/.env` and CORS config; confirm backend is running on port 5000 |
| `Invalid token` | `JWT_SECRET` mismatch between when the token was issued and now |
| `Route not found` | All backend routes start with `/api` |
| `Cast to ObjectId failed` | A non-ObjectId string was passed as `:id` |
| Seed fails | Ensure `MONGODB_URI` is set and the IP is whitelisted in Atlas |
| ML endpoints return empty/degraded data | Expected for unknown roles/skills/districts — by design, not a bug |
| `CERTIFICATE_VERIFY_FAILED` during `pip install` on Windows | TLS-inspecting antivirus/proxy issue — see `ml-service/README.md` §1 for the fix (`pip-system-certs` is already in `requirements.txt`) |
| Frontend can't reach backend locally | Confirm backend is running on :5000 and `vite.config.js`'s proxy target matches |

---

## Mock data notice

> All data in `backend/data/*.json` and everything generated by
> `ml-service/app/data/synthetic/` is **demo data only**, created for the
> SIH26134 prototype. It does not represent real companies, placements, or
> job market statistics. Swap in real data sources before any production use.
