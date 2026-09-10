# SIH26134 – Backend Progress & Handoff Summary

**Project:** Labour Market Intelligence & Curriculum Alignment Platform (Smart India Hackathon 2026)  
**Status:** ✅ Fully functional & verified locally  
**Timestamp:** September 2026  

---

## 1. Executive Summary

The backend for **SIH26134** is fully implemented using **Node.js, Express, MongoDB (Atlas/Local), and Mongoose**. All core REST APIs across authentication, role-based access control (Admin, Employer, Trainee), job listings, skills demand analytics, course pathways, employer validations, and district plans have been verified with 100% test pass rate.

---

## 2. Architecture & Components

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                    # Mongoose database connection
│   ├── models/                      # 10 Mongoose schemas & models
│   │   ├── User.js                  # Auth, roles (admin, employer, trainee)
│   │   ├── Job.js                   # Job postings with skills, districts, salaries
│   │   ├── Skill.js                 # Skill master catalog with categories & aliases
│   │   ├── Course.js                # Vocational/higher ed training courses
│   │   ├── GapScore.js              # Skill mismatch scores (0-100), flags, demand
│   │   ├── Recommendation.js        # AI/system recommendations for curriculum updates
│   │   ├── EmployerDemandSignal.js  # Direct employer hiring & skill demand inputs
│   │   ├── CourseValidation.js      # Employer course validation (approved/rejected/needs_update)
│   │   ├── DistrictPlan.js          # District-level skill demand vs supply plans
│   │   └── PlacementOutcome.js      # Course placement rate records
│   ├── controllers/                 # Express route handlers
│   │   ├── authController.js        # Register, login, getMe
│   │   ├── jobController.js         # List, getById, create, bulkCreate
│   │   ├── skillController.js       # List, getById, aggregated demand
│   │   ├── courseController.js      # List (with gap/rec enrichment), getById
│   │   ├── districtController.js    # District list & detailed district plans
│   │   ├── employerController.js    # Course validation & demand signal endpoints
│   │   ├── traineeController.js     # Career pathway matching & course ranking
│   │   └── adminController.js       # Stats, skill-demand, district-summary, recommendations
│   ├── routes/                      # API route definitions
│   │   ├── authRoutes.js            # /api/auth
│   │   ├── jobRoutes.js             # /api/jobs
│   │   ├── skillRoutes.js           # /api/skills
│   │   ├── courseRoutes.js          # /api/courses
│   │   ├── districtRoutes.js        # /api/districts
│   │   ├── employerRoutes.js        # /api/employer
│   │   ├── traineeRoutes.js         # /api/trainee
│   │   └── adminRoutes.js           # /api/admin
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification (Bearer token)
│   │   ├── roleMiddleware.js        # RBAC enforcer (admin, employer, trainee)
│   │   ├── errorMiddleware.js       # Centralized error formatting & status codes
│   │   └── notFoundMiddleware.js    # 404 handler for unmatched routes
│   ├── services/
│   │   ├── aiService.js             # Axios client for optional FastAPI ML service
│   │   └── recommendationService.js # High-gap courses aggregation helper
│   ├── utils/
│   │   └── generateToken.js         # JWT signing helper
│   └── app.js                       # Express app setup, middleware, routes, listener
├── scripts/
│   └── seed.js                      # DB seeding script (clears & loads mock JSON)
├── data/                            # Mock JSON dataset for prototype demonstration
│   ├── courses.json                 # 8 training courses
│   ├── district_plans.json          # 5 district development plans
│   ├── gap_scores.json              # 5 curriculum gap scores
│   ├── jobs.json                    # 20 real-world mock job postings
│   ├── recommendations.json         # 5 actionable curriculum recommendations
│   └── skills_master.json           # 15 master skills
├── .env.example                     # Environment template
└── package.json                     # Dependencies & scripts
```

---

## 3. Seeded Accounts & Credentials (Development)

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@sih26134.dev` | `Admin@1234` | Full access to stats, recommendations, district summaries, job management |
| **Employer** | Can be registered via `POST /api/auth/register` (role: `"employer"`) | User chosen | Validate courses, submit hiring demand signals |
| **Trainee** | Can be registered via `POST /api/auth/register` (role: `"trainee"`) | User chosen | Explore course pathways, public job & course directories |

---

## 4. Verified Endpoints & Test Results

All primary endpoints were verified against live MongoDB instance:

| Method | Endpoint | Auth Required | Status | Verified Result |
|---|---|---|---|---|
| `GET` | `/api/health` | Public | ✅ 200 | Database connected, environment development |
| `POST` | `/api/auth/register` | Public | ✅ 201 | Issues JWT and returns sanitized user object |
| `POST` | `/api/auth/login` | Public | ✅ 200 | Authenticates password with bcrypt, returns JWT |
| `GET` | `/api/auth/me` | Bearer Token | ✅ 200 | Fetches currently authenticated user profile |
| `GET` | `/api/jobs` | Public | ✅ 200 | Returns paginated jobs, supports filter by district, state, skill, role |
| `GET` | `/api/skills/demand` | Public | ✅ 200 | Aggregates skill frequency across all jobs with percentages |
| `GET` | `/api/courses` | Public | ✅ 200 | Enriches course data with gap score & curriculum recommendations |
| `GET` | `/api/courses/:id` | Public | ✅ 200 | Returns detailed course, placement %, gap score, recommendations |
| `GET` | `/api/districts` | Public | ✅ 200 | Returns distinct job districts with plan availability flag |
| `GET` | `/api/districts/:name/plan` | Public | ✅ 200 | Returns specific district's skill demand & oversupplied courses |
| `GET` | `/api/trainee/pathways` | Public | ✅ 200 | Computes match percentage and lists missing/matched skills for a target role |
| `POST` | `/api/employer/validate` | Employer | ✅ 201 | Submits course validation with approved/rejected/needs_update |
| `GET` | `/api/employer/validations` | Employer | ✅ 200 | Retrieves employer's submitted validations |
| `POST` | `/api/employer/demand-signal`| Employer | ✅ 201 | Submits employer hiring intent and skill requirements |
| `GET` | `/api/employer/demand-signals`| Employer | ✅ 200 | Retrieves employer's submitted demand signals |
| `GET` | `/api/admin/stats` | Admin | ✅ 200 | Returns counts for jobs, courses, skills, placement rate, high-gap courses |
| `GET` | `/api/admin/recommendations` | Admin | ✅ 200 | Returns all courses flagged for curriculum enhancement/updates |

---

## 5. Current State & Configuration

- **Environment Config:** `.env` is created with local MongoDB URI `mongodb://127.0.0.1:27017/sih26134` (can be replaced with Atlas URI anytime).
- **Dependencies:** All 158 npm packages are installed cleanly.
- **Data Integrity:** `npm run seed` executes deterministically and populates 15 skills, 20 jobs, 8 courses, 5 gap scores, 5 recommendations, 5 district plans, 5 placement outcomes, and the default admin.
- **FastAPI AI Integration:** `src/services/aiService.js` is implemented with a fail-safe fallback (if FastAPI service at `AI_SERVICE_URL` is offline, it gracefully returns an empty array without crashing API calls).

---

## 6. Known Considerations & Next Steps

1. **MongoDB Atlas Production URI:** For cloud deployment (e.g. Render / AWS), replace `MONGODB_URI` in `.env` or cloud dashboard with the MongoDB Atlas cluster URI and ensure 0.0.0.0/0 IP whitelist is enabled.
2. **Frontend Integration:** The React frontend should point to `http://localhost:5000/api` and attach `Authorization: Bearer <token>` for protected calls. CORS is already configured to allow `CLIENT_URL` (`http://localhost:5173` by default).
3. **Optional ML Service:** If the Python team runs the FastAPI skill extraction service (`http://localhost:8000/analyze-job`), configure `AI_SERVICE_URL` in `.env`.
