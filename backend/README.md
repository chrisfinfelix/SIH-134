# SIH26134 – Labour Market Intelligence & Curriculum Alignment Platform
## Backend API

> Smart India Hackathon 2026 prototype backend.  
> Node.js + Express + MongoDB Atlas

---

## What this backend does

This API connects job market demand data to training courses, identifies skill gaps, and provides
recommendations to align curricula with industry needs. It serves three user types:

- **Admin** – sees dashboard statistics, skill demand, district summaries, and course recommendations
- **Employer** – validates courses and submits hiring demand signals
- **Trainee** – gets ranked course pathways based on a target job role

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | express-validator |
| HTTP client | axios (for FastAPI integration) |
| Security | helmet, cors |
| Logging | morgan |

---

## Architecture

```
backend/
├── src/
│   ├── config/db.js               MongoDB Atlas connection
│   ├── models/                    10 Mongoose models
│   ├── controllers/               Request handlers (8 files)
│   ├── routes/                    Express routers (8 files)
│   ├── middleware/                auth, role, error, notFound
│   ├── services/                  aiService.js, recommendationService.js
│   ├── utils/generateToken.js     JWT helper
│   └── app.js                     Express entry point
├── scripts/seed.js                Data seeding script
├── data/                          Mock JSON files
└── .env.example
```

---

## Installation

```bash
git clone <repo>
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

---

## MongoDB Atlas Setup

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster (M0)
3. Create a database user (username + password)
4. Under Network Access → Add IP Address → Allow from anywhere (0.0.0.0/0) for development
5. Click Connect → Compass/Drivers → copy the connection string
6. Replace `<password>` in the string with your database user's password
7. Paste as `MONGODB_URI` in your `.env`

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/sih26134?retryWrites=true&w=majority
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
```

---

## Running Locally

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Server starts on `http://localhost:5000`

Health check: `GET http://localhost:5000/api/health`

---

## Seeding Mock Data

```bash
npm run seed
```

This will:
- Clear existing seeded data
- Insert 15 skills, 20 jobs, 8 courses
- Insert gap scores + recommendations (linked to correct courses)
- Insert 5 district plans, 5 placement outcomes
- Create a default admin account

Then enrich it with institutes, demo employer/trainee accounts and demand signals:

```bash
node scripts/seed_institutes_and_states.js
```

**Demo credentials (development only):**

| Role | Email | Password |
|---|---|---|
| Admin | admin@jobify.gov.in | Admin@123 |
| Employer | employer@techcorp.in | Employer@123 |
| Trainee | trainee@domain.in | Trainee@123 |
| Institute | institute@kitas.kerala.gov.in (and 3 others) | Institute@123 |

> ⚠️ `npm run seed` **deletes** jobs, courses, skills and related collections. Never point it at the production `MONGODB_URI`.
> Change the admin password before any real deployment. Admin accounts can only be created by the seed script — `POST /api/auth/register` ignores `role: "admin"`.

---

## Smoke Tests

With a local, seeded database and the server running:

```bash
npm run test:smoke                          # BASE_URL defaults to http://localhost:5000/api
BASE_URL=http://localhost:5055/api npm run test:smoke
```

Covers regex-safe search, admin self-registration, case-insensitive login, pagination, institute ownership checks and the AI proxy (skipped automatically if ml-service is down).

---

## Authentication

All protected endpoints require:

```
Authorization: Bearer <jwt_token>
```

Get a token by calling `POST /api/auth/login`.

### Roles

| Role | Access |
|---|---|
| `admin` | Full access including admin endpoints |
| `employer` | Employer endpoints (validate, demand signal) |
| `trainee` | Public endpoints + trainee pathway |
| `institute` | Own institute profile, courses, notifications, feedback |

Login and register are rate-limited to 30 requests per IP per 15 minutes.

---

## API Route Reference

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
| GET | /api/public/stats | No | - | Aggregate counts for the landing page |
| GET | /api/insights/status | Yes | Any | Is the ML service reachable? |
| GET | /api/insights/options | Yes | Any | Valid ML inputs (roles, skills, districts, courses) |
| GET | /api/insights/career-path/:node | Yes | Any | Skill-graph next steps (PageRank) |
| POST | /api/insights/skill-gap | Yes | Any | Bi-encoder + cross-encoder skill gap |
| POST | /api/insights/extract-skills | Yes | Any | NER skill extraction from free text |
| POST | /api/insights/classify-title | Yes | Any | Job title → NCO occupation code |
| POST | /api/insights/standardize-skill | Yes | Any | Raw skill → canonical skill |
| GET | /api/insights/forecast | Yes | admin, institute, employer | 6-month demand forecast + history |
| GET | /api/insights/trends | Yes | admin, institute, employer | BERTopic emerging skill topics |
| GET | /api/insights/curriculum | Yes | admin, institute | LambdaRank course ranking for a role |
| GET | /api/insights/oversupply/:courseId | Yes | admin, institute | Oversupply probability + SHAP reasons |
| POST | /api/insights/district-plan | Yes | admin | LP-optimised district training plan |

List endpoints (`/api/jobs`, `/api/courses`) return `pagination: { page, limit, total, totalPages }` (limit capped at 100). `/api/courses?flag=unassessed` lists courses with no gap score yet.

---

## Example Requests & Responses

### Register
```
POST /api/auth/register
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "role": "trainee"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": { "_id": "...", "name": "Jane Doe", "role": "trainee" }
  }
}
```

### Get Courses (with filters)
```
GET /api/courses?district=Ernakulam&flag=Needs%20Update&page=1&limit=10
```
Response:
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

### Trainee Pathways
```
GET /api/trainee/pathways?targetRole=Full%20Stack%20Developer
```
Response:
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

### Skill Demand
```
GET /api/skills/demand
```
Response:
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

## FastAPI / AI Integration

The Python ML team runs a FastAPI service separately. This backend is prepared to call it.

**How it works:**

The service lives in `../ml-service` (see its README). The backend uses it in three ways:

1. **Automatic skill extraction** — when a job is created (admin, employer or institute) with a description but no skills, `withExtractedSkills()` fills `skills` from the NER model.
2. **Role fallback** — `/api/trainee/pathways` asks the occupation classifier + skill graph for a role's skills when no local job postings match it (accepted only at ≥30% confidence).
3. **`/api/insights/*` proxy** — the browser never talks to the ML service directly; the backend validates input, enforces roles and forwards the call.

`analyzeJobDescription(description)` calls:
```
POST http://localhost:8000/analyze-job
{ "description": "Looking for React and Node.js developer" }
```

Expected response from FastAPI:
```json
{ "skills": ["React", "Node.js"] }
```

If the AI service is offline, core features keep working: skill extraction returns an empty array, and `/api/insights/*` returns `503` with a clear message.

Set `AI_SERVICE_URL` in `.env` to point to the FastAPI service URL.

---

## How the React Frontend Should Call This API

```javascript
// Login
const res = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password })
});
const { data } = await res.json();
localStorage.setItem("token", data.token);

// Authenticated request
const token = localStorage.getItem("token");
const res = await fetch("http://localhost:5000/api/admin/stats", {
  headers: { "Authorization": `Bearer ${token}` }
});
```

All successful responses follow:
```json
{ "success": true, "data": ... }
```
All errors follow:
```json
{ "success": false, "message": "..." }
```

---

## Deploying to Render

1. Push the `backend/` directory to a GitHub repo
2. Go to [https://render.com](https://render.com) → New → Web Service
3. Connect your repo
4. Set:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
5. Add Environment Variables in Render dashboard:
   - `MONGODB_URI` – your Atlas connection string
   - `JWT_SECRET` – a long random string
   - `CLIENT_URL` – your Vercel/Netlify frontend URL
   - `AI_SERVICE_URL` – your FastAPI service URL
   - `NODE_ENV` – `production`
6. Deploy

Render auto-assigns a port. The server uses `process.env.PORT` automatically.

---

## Troubleshooting

| Error | Fix |
|---|---|
| `MongoServerError: bad auth` | Check MONGODB_URI username/password |
| `Network Error` from React | Check CLIENT_URL in .env and CORS config |
| `Invalid token` | JWT_SECRET mismatch between login and request |
| `Route not found` | Check /api prefix. All routes start with /api |
| `Cast to ObjectId failed` | You passed a non-ObjectId string as :id |
| Seed fails | Ensure MONGODB_URI is set in .env and IP is whitelisted |

---

## Mock Data Notice

> All data in `data/*.json` is **demo data only**, created for the SIH26134 prototype.
> It does not represent real companies, placements, or job market statistics.
> The Data and ML teams will supply real data files in the same JSON format before final presentation.
