# DAY 1 — Phase 1: Project Structure Inspection Report

**Date:** 2026-08-26
**Scope:** Full codebase read — every file in `backend/` and `Frontend/`
**Status:** Complete

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Next.js)                        │
│                                                             │
│  NextAuth (MongoDB Atlas via Mongoose)                      │
│  ├── /api/auth/* (login, register, OTP, password reset)     │
│  ├── /api/phc (PHC profile GET/PUT)                         │
│  ├── /api/register (staff registration)                     │
│  └── /api/chat (DEPRECATED - returns inactive)              │
│                                                             │
│  Dashboard Pages (React Client Components)                  │
│  ├── /dashboard (stats, recent screenings)                  │
│  ├── /dashboard/patients/* (list, register, detail)         │
│  ├── /dashboard/screening/* (new, result)                   │
│  ├── /dashboard/screenings (history + filters)              │
│  ├── /dashboard/reports/* (index, printable report)         │
│  ├── /dashboard/phc (PHC profile edit)                      │
│  ├── /dashboard/profile (user profile, server component)    │
│  └── /dashboard/{alerts,assessments,facilities} (redirects) │
│                                                             │
│  API Client (lib/api/)                                      │
│  ├── backendClient.ts → snakeToCamel converter              │
│  ├── patients.ts → /api/patients/*                          │
│  ├── screening.ts → /api/screenings/*                       │
│  ├── reports.ts → /api/reports/*                             │
│  └── phc.ts → /api/phc/*                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │ next.config.ts rewrites:
                        │ /api/backend/* → localhost:8000
                        │ /storage/* → localhost:8000/storage/*
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI Backend (Python)                     │
│                                                             │
│  Routes:                                                    │
│  ├── /api/patients  (POST, GET, GET/:id, GET/:id/screenings)│
│  ├── /api/screenings (POST, POST/:id/image, POST/:id/quality│
│  │   POST/:id/analyze, GET, GET/:id)                       │
│  ├── /api/reports   (GET /summary)                          │
│  └── /api/phc       (GET /profile)                          │
│                                                             │
│  Services:                                                  │
│  ├── patient_service.py   (CRUD in MongoDB)                 │
│  ├── screening_service.py (CRUD, list, report summary)      │
│  ├── quality_service.py   (OpenCV: resolution/blur/bright)  │
│  ├── inference_service.py (MOCK: random grade 0-4)          │
│  ├── gradcam_service.py   (MOCK: Canny edge overlay)        │
│  ├── risk_service.py      (grade → risk mapping)            │
│  └── image_service.py     (save/validate/url generation)    │
│                                                             │
│  Static files: /storage/uploads/*, /storage/heatmaps/*      │
│  MongoDB: localhost:27017 → dr_screening database           │
│  Tests: 37/37 passing                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Dual Database Architecture

| Aspect | Backend (MongoDB) | Frontend (MongoDB) |
|---|---|---|
| **Database** | `mongodb://localhost:27017/dr_screening` | `mongodb+srv://...z04lboh.mongodb.net/` (Atlas 8.0.29) |
| **Driver** | PyMongo (raw dicts, no ORM) | Mongoose (ODM with schemas) |
| **Purpose** | Patients, screenings, health data | Auth only (Users, PHCs, OTPs) |
| **Collections** | `patients`, `screenings`, `counters` | `users`, `phcs`, `otps` |
| **Auth** | None (MVP, completely open) | NextAuth v5 with Credentials + Google |

**Observation:** The two databases are completely independent. Auth data lives in Atlas, clinical data lives in local MongoDB. There is no cross-reference between them (no `userId` on patients, no link from Atlas User to backend Patient).

---

## 3. Backend API Routes (Complete)

### 3.1 Patients (`/api/patients`)
| Method | Path | Handler | Purpose |
|---|---|---|---|
| `POST` | `/api/patients` | `create_patient_endpoint` | Create new patient |
| `GET` | `/api/patients` | `list_patients_endpoint` | List patients (search, pagination) |
| `GET` | `/api/patients/{id}` | `get_patient_endpoint` | Get patient by ID |
| `GET` | `/api/patients/{id}/screenings` | `get_patient_screenings_endpoint` | Get all screenings for a patient |

### 3.2 Screenings (`/api/screenings`)
| Method | Path | Handler | Purpose |
|---|---|---|---|
| `POST` | `/api/screenings` | `create_screening_endpoint` | Create screening (patient_id, eye) |
| `POST` | `/api/screenings/{id}/image` | `upload_image_endpoint` | Upload fundus image |
| `POST` | `/api/screenings/{id}/quality` | `quality_check_endpoint` | Run quality check |
| `POST` | `/api/screenings/{id}/analyze` | `analyze_endpoint` | Full pipeline: quality → inference → Grad-CAM → risk |
| `GET` | `/api/screenings/{id}` | `get_screening_endpoint` | Get single screening |
| `GET` | `/api/screenings` | `list_screenings_endpoint` | List screenings (filters: patient_id, risk, grade, date, pagination) |

### 3.3 Reports (`/api/reports`)
| Method | Path | Handler | Purpose |
|---|---|---|---|
| `GET` | `/api/reports/summary` | `reports_summary_endpoint` | Aggregate stats (totals, grade/risk distribution) |

### 3.4 PHC (`/api/phc`)
| Method | Path | Handler | Purpose |
|---|---|---|---|
| `GET` | `/api/phc/profile` | `get_phc_profile` | Get PHC profile (mock data) |

---

## 4. Frontend API Routes (Next.js)

| Method | Path | Purpose | Database |
|---|---|---|---|
| `POST` | `/api/register` | PHC staff registration with OTP flow | Atlas |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth login/session | Atlas |
| `POST` | `/api/auth/verify-otp` | Email verification OTP check | Atlas |
| `POST` | `/api/auth/resend-otp` | Resend OTP with 60s cooldown | Atlas |
| `POST` | `/api/auth/forgot-password` | Password reset OTP | Atlas |
| `POST` | `/api/auth/reset-password` | Password reset with OTP | Atlas |
| `GET` | `/api/phc` | Get PHC profile (auth-protected) | Atlas |
| `PUT` | `/api/phc` | Update PHC profile (auth-protected) | Atlas |
| `POST` | `/api/chat` | **DEPRECATED** — returns inactive | None |

---

## 5. Frontend → Backend Data Flow

### 5.1 Screening Pipeline (the core workflow)
```
Frontend: new/page.tsx
  1. getPatients()          → GET /api/patients
  2. registerPatient()      → POST /api/patients (if new)
  3. createScreening()      → POST /api/screenings
  4. uploadScreeningImage() → POST /api/screenings/{id}/image
  5. [quality pre-check client-side]
  6. analyzeScreening()     → POST /api/screenings/{id}/analyze
     └─ Backend: quality → inference → Grad-CAM → risk (all in one call)

Frontend: screening/[screeningId]/page.tsx
  7. getScreeningResult()   → GET /api/screenings/{id}
  8. Renders: heatmap/original/split views, DR grade, risk assessment

Frontend: reports/[screeningId]/page.tsx
  9. getScreeningReport()   → GET /api/screenings/{id}
  10. Renders: official printable report with PHC branding
```

### 5.2 Field Mapping (backendClient.ts `snakeToCamel()`)
| Backend Field | Frontend Field | Notes |
|---|---|---|
| `patient_id` | `patientId` AND `id` | Dual assignment |
| `screening_id` | `screeningId` AND `id` | Dual assignment |
| `created_at` | `date` | Manual mapping |
| `confidence` (0.0-1.0) | `confidence` (0-100) | ×100 conversion |
| `risk.level` (`"low"`) | `risk` (`"LOW RISK"`) | `toUpperSnake()` |
| `explanation.heatmap_url` | `heatmapUrl` | Manual mapping |
| `status` (`"created"`) | `status` (`"pending"`) | Manual mapping |
| Prediction | + `label`, `description` | Injected by `_enrich_screening()` |
| Screening | + `patient_name`, `patient_age`, `patient_gender`, `diabetes_duration_years` | Injected by `_enrich_screening()` |

---

## 6. Analysis Pipeline — Full Breakdown

The `POST /api/screenings/{id}/analyze` endpoint (`analyze_endpoint`):

1. Validates screening exists and has an image
2. Sets status → `quality_checking`
3. Runs `assess_image_quality()` — checks resolution (≥512×512), blur (Laplacian variance ≥100), brightness (40-220), contrast (≥30)
4. If quality = `poor` (score < 0.75): sets risk to `recapture`, status → `quality_failed`, returns early
5. If quality = `good` (score ≥ 0.75): sets status → `ai_processing`
6. Runs `run_inference()` — **currently MOCK** (random grade 0-4, random confidence)
7. Runs `generate_gradcam()` — **currently MOCK** (Canny edge detection overlay, not real Grad-CAM)
8. Maps grade → risk via `map_grade_to_risk()`:
   - Grade 0 → low
   - Grade 1 → monitor
   - Grade 2 → high
   - Grade 3 → urgent
   - Grade 4 → urgent
9. Updates screening with prediction, explanation, risk
10. Enriches via `_enrich_screening()` and returns full result

---

## 7. Existing Models & Data Schemas

### Backend (PyMongo — raw dicts)

**Patients collection:**
```
{
  patient_id: str,           // "PAT-XXXX" (auto-increment)
  name: str,
  age: int,
  gender: str,               // "male" | "female" | "other"
  contact: str,
  diabetes_duration_years: float | null,
  created_at: str            // ISO datetime
}
```

**Screenings collection:**
```
{
  screening_id: str,          // "SCR-XXXX" (auto-increment)
  patient_id: str,
  eye: str,                   // "left" | "right"
  status: str,                // "created" | "image_uploaded" | "quality_checking" | "ai_processing" | "completed" | "quality_failed" | "failed"
  image_path: str | null,
  image_url: str | null,
  image_quality: {            // null until quality check
    status: "good" | "poor",
    score: float,             // 0.0 - 1.0
    checks: { resolution: bool, blur: bool, brightness: bool, contrast: bool },
    issues: str[],
    action: str | null        // "recapture" | null
  },
  prediction: {               // null until analysis
    grade: int,               // 0-4
    confidence: float,        // 0.0-1.0
    label: str,               // "No DR" | "Mild DR" | ... (injected by _enrich)
    description: str          // (injected by _enrich)
  },
  explanation: {
    heatmap_url: str          // "/storage/heatmaps/SCR-XXXX_heatmap.png"
  } | null,
  risk: {
    level: str,               // "low" | "monitor" | "high" | "urgent" | "recapture"
    reason: str
  } | null,
  created_at: str             // ISO datetime
}
```

**Counters collection:**
```
{ _id: "screening_id", seq: int }   // auto-increment for SCR-XXXX
{ _id: "patient_id", seq: int }     // auto-increment for PAT-XXXX
```

### Frontend (Mongoose — Atlas)

**User model:**
```
{
  name: string,
  email: string (unique, lowercase),
  password: string (bcrypt),
  provider: "credentials" | "google",
  role: "phc_staff",
  phcId: ObjectId → PHC,
  isVerified: boolean
}
```

**PHC model:**
```
{
  name: string,
  code: string (unique, uppercase),
  state: string,
  district: string,
  address: string,
  contactNumber: string,
  healthcareWorkerName: string
}
```

**OTP model:**
```
{
  email: string,
  otpHash: string (bcrypt),
  purpose: "email_verification" | "password_reset",
  expiresAt: Date,
  attempts: number,           // max 5
  lastSentAt: Date
}
```

---

## 8. Key Observations

| # | Observation | Severity |
|---|---|---|
| 1 | **Two completely separate databases** — no link between auth users and backend patients | Architecture |
| 2 | **Backend has zero authentication** — all API routes are publicly accessible | Security (MVP acceptable) |
| 3 | **AI inference is mocked** — `random.choices([0,1,2,3,4])` with random confidence | Placeholder |
| 4 | **Grad-CAM is mocked** — Canny edge overlay, not real model explainability | Placeholder |
| 5 | **`/api/chat` is deprecated** — returns `{ message: 'Chat endpoint is inactive.' }` | Dead code |
| 6 | **`brain.py` sits in Frontend root** — standalone Groq LLM module, not integrated into Next.js app | Orphan file |
| 7 | **3 redirect stub pages** — `/alerts`, `/assessments`, `/facilities` just redirect | Stub features |
| 8 | **`getPHCProfile()` in phc.ts calls `GET /api/phc`** — frontend API route, NOT backend proxy | Correct (auth-protected) |
| 9 | **`getPatients()`, `getScreeningHistory()` call `/api/backend/*`** — proxied to FastAPI | Correct |
| 10 | **`getScreeningReport()` calls `GET /api/backend/screenings/{id}`** — same as get result, report is a frontend rendering | Correct |
| 11 | **`_enrich_screening()`** injects patient details + grade labels/descriptions into every screening response | Server-side enrichment |
| 12 | **Quality threshold is ≥0.75** (3/4 checks pass) — hardcoded in `quality_service.py` | Configuration |
| 13 | **OTP system** — bcrypt-hashed, 10min expiry, 60s resend cooldown, 5 max attempts | Well-implemented |
| 14 | **Email fallback** — logs OTP to server console in dev when SMTP not configured | Dev convenience |
| 15 | **37 backend tests all passing** | Good coverage |

---

## 9. Files Inventory

### Backend (Python)
```
backend/
├── app/
│   ├── main.py                    — FastAPI app entrypoint
│   ├── core/
│   │   ├── config.py              — env vars, GRADE_LABELS, GRADE_DESCRIPTIONS
│   │   ├── database.py            — MongoDB connection (global singleton)
│   │   └── logging.py             — logger setup
│   ├── api/
│   │   ├── __init__.py            — empty
│   │   ├── patients.py            — 4 endpoints
│   │   ├── screenings.py          — 6 endpoints + _enrich_screening()
│   │   ├── reports.py             — 1 endpoint
│   │   └── phc.py                 — 1 endpoint
│   ├── schemas/
│   │   ├── __init__.py            — empty
│   │   ├── patient.py             — PatientCreate, PatientResponse
│   │   ├── screening.py           — ScreeningCreate, ScreeningResponse
│   │   ├── quality.py             — QualityResponse
│   │   ├── result.py              — ResultResponse
│   │   └── phc.py                 — PHCResponse
│   └── services/
│       ├── patient_service.py     — CRUD (create, get, list, get_screenings)
│       ├── screening_service.py   — CRUD, list w/ pagination, report summary
│       ├── quality_service.py     — OpenCV quality checks (4 criteria)
│       ├── inference_service.py   — MOCK inference (random grade)
│       ├── gradcam_service.py     — MOCK Grad-CAM (Canny edge overlay)
│       ├── risk_service.py        — grade→risk mapping
│       └── image_service.py       — image save/validate/url generation
├── storage/
│   ├── uploads/                   — uploaded fundus images
│   └── heatmaps/                  — generated heatmap images
├── tests/
│   └── test_api.py                — 37 tests (all passing)
├── requirements.txt               — 12 dependencies
└── .env                           — (contains secrets, not read)
```

### Frontend (Next.js)
```
Frontend/
├── auth.ts                        — NextAuth config (MongoDB adapter)
├── auth.config.ts                 — Credentials provider (email/password + Google)
├── middleware.ts                   — Route protection (/dashboard requires auth)
├── next.config.ts                 — Proxy rewrites to FastAPI backend
├── .env.local                     — env vars (2 MongoDB URIs, AI key, SMTP, etc.)
├── lib/
│   ├── mongodb.ts                 — Mongoose Atlas connection
│   ├── mockData.ts                — fallback data
│   ├── ai.ts                      — Gemini AI helper (SYSTEM_PROMPT, not integrated)
│   ├── email.ts                   — nodemailer email service (with dev fallback)
│   ├── otp.ts                     — OTP generation/hashing (bcrypt)
│   ├── validations.ts             — zod schemas (register, login, OTP, password)
│   ├── utils.ts                   — apiSuccess, apiError helpers
│   └── api/
│       ├── types.ts               — TypeScript interfaces (Patient, Screening, etc.)
│       ├── backendClient.ts       — snakeToCamel converter + field remapping
│       ├── patients.ts            — patient API calls (to FastAPI)
│       ├── screening.ts           — screening API calls (to FastAPI)
│       ├── reports.ts             — reports API calls (to FastAPI)
│       └── phc.ts                 — PHC API calls (to Next.js /api/phc)
├── models/
│   ├── User.ts                    — Mongoose User schema
│   ├── PHC.ts                     — Mongoose PHC schema
│   └── OTP.ts                     — Mongoose OTP schema
├── brain.py                       — ORPHAN Groq LLM health assistant (not integrated)
├── app/
│   ├── login/page.tsx             — Login page (credentials + Google OAuth)
│   ├── register/page.tsx          — Register page (PHC staff registration)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts  — NextAuth handler
│   │   │   ├── verify-otp/route.ts     — OTP verification (email verify + password reset)
│   │   │   ├── resend-otp/route.ts     — OTP resend (60s cooldown)
│   │   │   ├── forgot-password/route.ts — Password reset OTP
│   │   │   └── reset-password/route.ts  — Password reset (OTP + new password)
│   │   ├── register/route.ts      — Staff registration (creates User + PHC + sends OTP)
│   │   ├── chat/route.ts          — DEPRECATED (returns inactive)
│   │   └── phc/route.ts           — PHC profile GET/PUT (auth-protected)
│   └── dashboard/
│       ├── layout.tsx             — Dashboard layout (auth gate, sidebar, navigation)
│       ├── page.tsx               — PHC dashboard (stats cards, recent screenings)
│       ├── patients/
│       │   ├── page.tsx           — Patient list (search, pagination)
│       │   ├── register/page.tsx  — Patient registration form
│       │   └── [patientId]/page.tsx — Patient detail + screenings history
│       ├── screening/
│       │   ├── new/page.tsx       — New screening (upload, quality check, inline register)
│       │   └── [screeningId]/page.tsx — Screening result (heatmap/original/split views)
│       ├── screenings/page.tsx    — Screening history (filters: risk, grade)
│       ├── reports/
│       │   ├── page.tsx           — Reports index (screening list)
│       │   └── [screeningId]/page.tsx — Printable screening report
│       ├── phc/page.tsx           — PHC profile edit form
│       ├── profile/page.tsx       — User profile (server component, reads session)
│       ├── alerts/page.tsx        — REDIRECT → /dashboard
│       ├── assessments/page.tsx   — REDIRECT → /dashboard/screenings
│       └── facilities/page.tsx    — REDIRECT → /dashboard/phc
├── components/
│   ├── dashboard/                 — Dashboard UI components
│   └── screening/                 — Screening UI components
├── package.json
└── tsconfig.json
```

---

## 10. Dependencies

### Backend (`requirements.txt`)
```
fastapi            — Web framework
uvicorn[standard]  — ASGI server
pydantic           — Data validation
pymongo            — MongoDB driver
python-multipart   — File upload support
opencv-python-headless — Image processing (quality checks)
numpy              — Array operations
pillow             — Image handling
python-dotenv      — .env loading
aiofiles           — Async file operations
httpx              — HTTP client (for future AI service calls)
pytest             — Testing
```

### Frontend (key dependencies from package.json)
```
next / react / react-dom    — Framework
next-auth / @auth/mongodb-adapter — Authentication
mongoose                    — MongoDB ODM (for auth DB)
bcryptjs                    — Password/OTP hashing
nodemailer                  — Email sending
zod                         — Schema validation
lucide-react                — Icons
@radix-ui/*                 — UI primitives
tailwindcss                 — Styling
framer-motion               — Animations
```

---

*End of Phase 1 — Day 1 Report*

---

# DAY 1 — Phase 2: Feature Mapping Report

**Date:** 2026-08-26
**Scope:** Every user story traced end-to-end through UI → API client → API route → backend service → database
**Status:** Complete

---

## 1. User Story Traceability Matrix

Each user story is traced from the browser click through every layer to the final database write or read. Line numbers reference the current codebase.

### US-01: Staff Registration

| Layer | Path | File:Line |
|---|---|---|
| UI | `/register` → `RegisterForm` component | `Frontend/app/register/page.tsx:1` |
| Validation | zod `registerSchema` (name, email, password, confirmPassword) | `Frontend/lib/validations.ts` |
| API Client | `registerStaff(data)` → POST `/api/register` | `Frontend/components/auth/RegisterForm.tsx` |
| Next.js Route | `POST /api/register` — creates User + PHC in Atlas, generates OTP, sends verification email | `Frontend/app/api/register/route.ts` |
| Database Write | `User.create()` — Mongoose → Atlas `users` collection | `Frontend/models/User.ts` |
| Database Write | `PHC.create()` — Mongoose → Atlas `phcs` collection | `Frontend/models/PHC.ts` |
| Database Write | `OTP.create()` — bcrypt-hashed 6-digit code → Atlas `otps` collection | `Frontend/models/OTP.ts` |
| Side Effect | Sends verification email via nodemailer (or console fallback in dev) | `Frontend/lib/email.ts` |

**Data flow:** Form → zod validation → Next.js API route → 3 Atlas writes (User, PHC, OTP) → email sent → redirect to `/verify-email`

---

### US-02: Email Verification (OTP)

| Layer | Path | File:Line |
|---|---|---|
| UI | `VerifyOTPForm` component | `Frontend/components/auth/VerifyOTPForm.tsx` |
| API Client | `verifyOTP(email, otp)` → POST `/api/auth/verify-otp` | Same component |
| Next.js Route | `POST /api/auth/verify-otp` — finds OTP by email+purpose, checks expiry, verifies bcrypt hash, checks attempts (max 5) | `Frontend/app/api/auth/verify-otp/route.ts` |
| Database Read | `OTP.findOne({ email, purpose })` — Atlas | `Frontend/models/OTP.ts` |
| Database Write | `User.findOneAndUpdate({ email }, { isVerified: true })` — marks user verified | `Frontend/models/User.ts` |
| Database Write | `OTP.deleteMany({ email })` — clears used OTPs | `Frontend/models/OTP.ts` |

**Guard rails:** 10-minute expiry (`OTP_EXPIRATION_MS`), 60-second resend cooldown (`RESEND_COOLDOWN_MS`), max 5 attempts (`MAX_OTP_ATTEMPTS`), bcrypt comparison

---

### US-03: Login (Credentials)

| Layer | Path | File:Line |
|---|---|---|
| UI | `/login` → `LoginForm` | `Frontend/app/login/page.tsx` |
| API Client | `signIn("credentials", { email, password, redirect: false })` | NextAuth `signIn` |
| NextAuth | `authorize()` in `auth.config.ts` — queries Atlas `users` by email, bcrypt compare | `Frontend/auth.config.ts` |
| JWT Callback | `jwt` callback enriches token with `phcId` + `role` from user record | `Frontend/auth.ts` |
| Session Callback | `session` callback exposes `id`, `phcId`, `role` to client | `Frontend/auth.ts` |
| Database Read | `User.findOne({ email })` — Atlas | Via Mongoose in `auth.config.ts` |

**Post-login:** Middleware redirects to `/dashboard` for logged-in users accessing `/login` or `/register`

---

### US-04: Login (Google OAuth)

| Layer | Path | File:Line |
|---|---|---|
| UI | `/login` → Google button → `signIn("google")` | `Frontend/app/login/page.tsx` |
| NextAuth | Google provider in `auth.config.ts` | `Frontend/auth.config.ts` |
| `signIn` Callback | Creates or updates User in Atlas with `{ name, email, image, provider: "google" }` | `Frontend/auth.ts` `signIn` callback |
| `jwt` Callback | Enriches token with `phcId` + `role` (creates PHC if none exists) | `Frontend/auth.ts` `jwt` callback |

**Auto-creates PHC:** If Google user has no `phcId`, the `jwt` callback creates a default PHC document and links it

---

### US-05: Dashboard View

| Layer | Path | File:Line |
|---|---|---|
| UI | `/dashboard` → `DashboardContent` | `Frontend/app/dashboard/page.tsx` |
| Data Loading | `Promise.all(getScreeningHistory(), getPatients(), getPHCProfile())` | Same file |
| API Call 1 | `getScreeningHistory()` → GET `/api/backend/screenings?limit=5` | `Frontend/lib/api/screening.ts` → `backendClient.ts` → FastAPI `list_screenings_endpoint` |
| API Call 2 | `getPatients()` → GET `/api/backend/patients?limit=50` | `Frontend/lib/api/patients.ts` → FastAPI `list_patients_endpoint` |
| API Call 3 | `getPHCProfile()` → GET `/api/phc` | `Frontend/lib/api/phc.ts` → **Next.js API route** (NOT backend) |
| Stats Computation | Client-side: total screenings, unique patients, urgent/high-risk counts, screenings this month | `Frontend/app/dashboard/page.tsx` (React state) |

**Note:** PHC profile comes from Atlas (Next.js route), patients/screenings from local MongoDB (FastAPI)

---

### US-06: Patient Registration

| Layer | Path | File:Line |
|---|---|---|
| UI | `/dashboard/patients/register` → `PatientRegistrationForm` | `Frontend/app/dashboard/patients/register/page.tsx` |
| API Client | `registerPatient(data)` → POST `/api/backend/patients` | `Frontend/lib/api/patients.ts` → `backendClient.ts` |
| Backend Route | `create_patient_endpoint` → validates `PatientCreate` schema | `backend/app/api/patients.py` |
| Service | `create_patient(name, age, gender, contact, diabetes_duration_years)` | `backend/app/services/patient_service.py` |
| Database Write | `db.patients.insert_one(...)` with auto-increment `PAT-XXXX` ID | `backend/app/services/patient_service.py` |
| Post-Create | Redirect to `/dashboard/screening/new?patientId={id}` for immediate screening | `Frontend/app/dashboard/patients/register/page.tsx` |

---

### US-07: Patient List

| Layer | Path | File:Line |
|---|---|---|
| UI | `/dashboard/patients` → client component with search | `Frontend/app/dashboard/patients/page.tsx` |
| API Client | `getPatients(searchQuery)` → GET `/api/backend/patients?search={q}` | `Frontend/lib/api/patients.ts` |
| Backend Route | `list_patients_endpoint(search, page, limit)` | `backend/app/api/patients.py` |
| Service | `list_patients(search, page, limit)` — regex search on name, returns paginated results | `backend/app/services/patient_service.py` |
| Database Read | `db.patients.find({ "$or": [{ name: regex }] }).skip().limit()` | Via PyMongo |

---

### US-08: Patient Detail

| Layer | Path | File:Line |
|---|---|---|
| UI | `/dashboard/patients/[patientId]` → patient info + screening history | `Frontend/app/dashboard/patients/[patientId]/page.tsx` |
| Data Loading | `Promise.all(getPatientById(id), getScreeningsByPatientId(id))` | Same file |
| API Call 1 | `getPatientById(id)` → GET `/api/backend/patients/{id}` | `Frontend/lib/api/patients.ts` → FastAPI |
| API Call 2 | `getScreeningsByPatientId(id)` → GET `/api/backend/patients/{id}/screenings` | Same → FastAPI `get_patient_screenings_endpoint` |
| Backend Service | `get_patient_screenings(patient_id)` — joins patient + screenings from MongoDB | `backend/app/services/patient_service.py` |

---

### US-09: New Screening (Core Workflow)

| Layer | Path | File:Line |
|---|---|---|
| UI | `/dashboard/screening/new` → `NewScreeningForm` | `Frontend/app/dashboard/screening/new/page.tsx` |
| Step 1: Patient Select | Dropdown from `getPatients()`, or quick inline `registerPatient()` | Same file |
| Step 2: Eye Select | Radio buttons: left/right | Same file |
| Step 3: Image Upload | Drag-drop zone → `handleImageUpload()` → stores in `File` state | Same file |
| Step 4: Submit | `runFullScreening(patientId, eye, imageFile)` | `Frontend/lib/api/screening.ts` |
| Orchestrator | `runFullScreening()` chains 3 calls sequentially: | `Frontend/lib/api/backendClient.ts` |
| 4a | `createScreening(patientId, eye)` → POST `/api/backend/screenings` | → FastAPI `create_screening_endpoint` |
| 4b | `uploadScreeningImage(screeningId, file)` → POST `/api/backend/screenings/{id}/image` | → FastAPI `upload_image_endpoint` |
| 4c | `analyzeScreening(screeningId)` → POST `/api/backend/screenings/{id}/analyze` | → FastAPI `analyze_endpoint` |
| Post-Analysis | Navigate to `/dashboard/screening/{screeningId}` | Same file |

**Backend `analyze_endpoint` internal pipeline** (see Section 2 below)

---

### US-10: Image Quality Check

| Layer | Path | File:Line |
|---|---|---|
| Backend Entry | `analyze_endpoint` in `screenings.py:100` | `backend/app/api/screenings.py` |
| Service Call | `assess_image_quality(image_path)` | `backend/app/services/quality_service.py:47` |
| Check 1: Resolution | `check_resolution(img)` — min 512×512 | `quality_service.py:14` |
| Check 2: Blur | `check_blur(img)` — Laplacian variance ≥ 100 | `quality_service.py:21` |
| Check 3: Brightness | `check_brightness(img)` — mean 40-220 | `quality_service.py:29` |
| Check 4: Contrast | `check_contrast(img)` — std dev ≥ 30 | `quality_service.py:39` |
| Threshold | Score ≥ 0.75 (3/4 checks pass) → `"good"`, else → `"poor"` | `quality_service.py:90` |
| Poor Quality | Sets `status: "quality_failed"`, `risk: { level: "recapture" }`, returns early | `screenings.py:112-124` |

---

### US-11: AI Inference (MOCK)

| Layer | Path | File:Line |
|---|---|---|
| Backend Entry | `analyze_endpoint` → `run_inference(image_path)` | `screenings.py:128` |
| Service | `run_inference(image_path)` | `backend/app/services/inference_service.py` |
| Implementation | `random.choices([0,1,2,3,4], weights=[30,25,25,15,5])` + `random.uniform(0.75, 0.98)` | `inference_service.py` |
| Output | `{ grade: int, confidence: float }` | Same |

**CRITICAL:** This is a placeholder. The real CNN model is owned by another team member and not yet integrated.

---

### US-12: Grad-CAM Heatmap (MOCK)

| Layer | Path | File:Line |
|---|---|---|
| Backend Entry | `analyze_endpoint` → `generate_gradcam(image_path, screening_id)` | `screenings.py:129` |
| Service | `generate_gradcam(image_path, screening_id)` | `backend/app/services/gradcam_service.py` |
| Implementation | grayscale → Canny edge detection → `applyColorMap(JET)` → overlay 60/40 blend → save PNG | `gradcam_service.py` |
| Output Path | `storage/heatmaps/{screening_id}_heatmap.png` | Same |
| URL | `/storage/heatmaps/{screening_id}_heatmap.png` (served by FastAPI static files) | `main.py` mount |

**CRITICAL:** This is a placeholder. Not real model explainability.

---

### US-13: Risk Assessment

| Layer | Path | File:Line |
|---|---|---|
| Backend Entry | `analyze_endpoint` → `map_grade_to_risk(grade)` | `screenings.py:134` |
| Service | `map_grade_to_risk(grade)` | `backend/app/services/risk_service.py` |
| Mapping | Grade 0→`low`, 1→`monitor`, 2→`high`, 3→`urgent`, 4→`urgent` | Same |
| Output | `{ level: str, reason: str, recommendation: str, action: str, follow_up: str }` | Same |
| Poor Image | `get_poor_image_risk()` → `{ level: "recapture", reason: "poor quality" }` | Same |

**Frontend Mapping** (in `backendClient.ts`):
- Backend `"low"` → Frontend `"LOW RISK"`
- Backend `"high"` → Frontend `"HIGH RISK"`
- Backend `"urgent"` → Frontend `"URGENT"`
- Backend `"monitor"` → Frontend `"MONITOR"`
- Backend `"recapture"` → Frontend `"RECAPTURE"`

---

### US-14: Screening Result View

| Layer | Path | File:Line |
|---|---|---|
| UI | `/dashboard/screening/[screeningId]` → `ScreeningResultView` | `Frontend/app/dashboard/screening/[screeningId]/page.tsx` |
| Data Loading | `getScreeningResult(screeningId)` → GET `/api/backend/screenings/{id}` | `Frontend/lib/api/screening.ts` → FastAPI `get_screening_endpoint` |
| Backend | `_enrich_screening()` injects patient details + grade labels + descriptions | `screenings.py:26-42` |
| Display Tabs | Heatmap view / Original image / Side-by-side comparison | `ScreeningResultView` component |
| DR Grade | Badge with color coding (green No DR → red Proliferative) | Same |
| Risk Level | Risk badge + recommendation text + follow-up timeframe | Same |
| AI Explanation | Grade description text from `GRADE_DESCRIPTIONS` (injected by `_enrich`) | Same |
| Print Button | Links to `/dashboard/reports/{screeningId}` | Same |

---

### US-15: Screening History

| Layer | Path | File:Line |
|---|---|---|
| UI | `/dashboard/screenings` → filterable table | `Frontend/app/dashboard/screenings/page.tsx` |
| Filters | Client-side: search text, risk level dropdown, DR grade dropdown | Same file |
| API Client | `getScreeningHistory({ search, riskLevel, drGrade })` → GET `/api/backend/screenings` | `Frontend/lib/api/screening.ts` → FastAPI `list_screenings_endpoint` |
| Backend | `list_screenings(patient_id, risk, grade, date_from, date_to, page, limit)` | `backend/app/services/screening_service.py` |
| DB Query | `db.screenings.find()` with optional filters + pagination | Same |
| Enrichment | `_enrich_screening()` applied to each item | `screenings.py:200` |
| **Filter Note** | Risk/grade filtering is done **client-side** in the frontend, not server-side | `screening.ts` returns all, filters in `getScreeningHistory()` |

---

### US-16: Official Report

| Layer | Path | File:Line |
|---|---|---|
| UI | `/dashboard/reports/[screeningId]` → printable report | `Frontend/app/dashboard/reports/[screeningId]/page.tsx` |
| Data Loading | `getScreeningReport(screeningId)` → merges `getScreeningResult()` + `getPHCProfile()` | `Frontend/lib/api/reports.ts` |
| API Call 1 | `getScreeningResult()` → GET `/api/backend/screenings/{id}` | FastAPI |
| API Call 2 | `getPHCProfile()` → GET `/api/phc` | Next.js route → Atlas |
| Merge | `{ ...screeningResult, phcProfile }` | `reports.ts` |
| Display | PHC header (name, code, address, worker) + screening details + heatmap + DR grade + risk + disclaimer | `reports/[screeningId]/page.tsx` |

---

### US-17: PHC Profile Management

| Layer | Path | File:Line |
|---|---|---|
| UI | `/dashboard/phc` → PHC edit form | `Frontend/app/dashboard/phc/page.tsx` |
| Load | `getPHCProfile()` → GET `/api/phc` | `Frontend/lib/api/phc.ts` → **Next.js API route** |
| Save | `updatePHCProfile(data)` → PUT `/api/phc` | Same |
| Next.js Route | Auth-protected GET/PUT → Atlas `phcs` collection | `Frontend/app/api/phc/route.ts` |
| Auth Check | `const session = await auth()` — 401 if not logged in | Same file |
| DB Lookup | `PHC.findById(session.user.phcId)` → fallback `User.findById()` → fallback `PHC.findOne()` | Same file |
| DB Write | `phc.save()` after field updates | Same file |

**IMPORTANT:** PHC profile lives in Atlas (Next.js route), NOT in backend MongoDB. The backend `GET /api/phc/profile` endpoint returns mock data and is NOT called by the frontend.

---

### US-18: User Profile

| Layer | Path | File:Line |
|---|---|---|
| UI | `/dashboard/profile` → server component | `Frontend/app/dashboard/profile/page.tsx` |
| Auth | `const session = await auth()` — redirects to `/login` if no session | Same file |
| Display | `UserProfile` component with name, email, role from session | `Frontend/components/dashboard/UserProfile` |
| No API Call | All data comes from the NextAuth JWT session — no database read | N/A |

---

### US-19: Forgot Password

| Layer | Path | File:Line |
|---|---|---|
| UI | Triggered from login page → `ForgotPasswordForm` | `Frontend/components/auth/ForgotPasswordForm.tsx` |
| API Client | `forgotPassword(email)` → POST `/api/auth/forgot-password` | Same component |
| Next.js Route | Returns generic success message regardless of email existence (prevents enumeration) | `Frontend/app/api/auth/forgot-password/route.ts` |
| Side Effect | Generates OTP with `purpose: "password_reset"`, sends email (or console log in dev) | Same + `Frontend/lib/otp.ts` |

---

### US-20: Reset Password

| Layer | Path | File:Line |
|---|---|---|
| UI | `ResetPasswordForm` | `Frontend/components/auth/ResetPasswordForm.tsx` |
| API Client | `resetPassword(email, otp, newPassword)` → POST `/api/auth/reset-password` | Same component |
| Next.js Route | Verifies OTP (same verify logic as US-02), then `User.findOneAndUpdate({ email }, { password: hashedPassword })` | `Frontend/app/api/auth/reset-password/route.ts` |
| Database Write | New bcrypt-hashed password written to Atlas `users` | Via Mongoose |

---

## 2. Backend Analysis Pipeline — Internal State Machine

The `POST /api/screenings/{id}/analyze` endpoint drives the screening through these states:

```
created → image_uploaded → quality_checking → ai_processing → completed
                                   │                    │
                                   ↓ (if poor)          ↓ (if exception)
                              quality_failed          failed
```

### State Transitions (exact code)

| Step | State Set | Condition | File:Line |
|---|---|---|---|
| Create screening | `created` | Always | `patient_service.py` → `screening_service.py` |
| Upload image | `image_uploaded` | Valid image uploaded | `screenings.py:77-81` |
| Start quality check | `quality_checking` | Always | `screenings.py:108` |
| Quality fails | `quality_failed` | `quality["status"] == "poor"` (score < 0.75) | `screenings.py:112-114` |
| Start AI | `ai_processing` | Quality passed | `screenings.py:126` |
| AI success | `completed` | Inference + Grad-CAM succeed | `screenings.py:136-141` |
| AI failure | `failed` | Exception in inference or Grad-CAM | `screenings.py:131-132` |

### Risk Level Mapping

| DR Grade | Label | Backend Risk Level | Frontend Display | Recommendation |
|---|---|---|---|---|
| 0 | No DR | `low` | LOW RISK | Annual screening |
| 1 | Mild DR | `monitor` | MONITOR | 6-month follow-up |
| 2 | Moderate DR | `high` | HIGH RISK | Specialist referral |
| 3 | Severe DR | `urgent` | URGENT | Immediate referral |
| 4 | Proliferative | `urgent` | URGENT | Emergency care |
| N/A | Quality Issue | `recapture` | RECAPTURE | Retake image |

---

## 3. Orphan & Dead Code

| File | Location | Status | Impact |
|---|---|---|---|
| `brain.py` | `Frontend/brain.py` | Standalone Groq LLM health assistant | Not integrated into any route or component |
| `/api/chat` route | `Frontend/app/api/chat/route.ts` | Returns `{ message: 'Chat endpoint is inactive.' }` | Deprecated, no client calls it |
| `lib/ai.ts` | `Frontend/lib/ai.ts` | Gemini AI integration with `SYSTEM_PROMPT` | Usage unclear — no explicit import found in any page or API route |
| Alerts page | `Frontend/app/dashboard/alerts/page.tsx` | `redirect('/dashboard')` | Stub, no feature |
| Assessments page | `Frontend/app/dashboard/assessments/page.tsx` | `redirect('/dashboard/screenings')` | Stub, no feature |
| Facilities page | `Frontend/app/dashboard/facilities/page.tsx` | `redirect('/dashboard/phc')` | Stub, no feature |
| `mockData.ts` | `Frontend/lib/mockData.ts` | `INITIAL_PHC_PROFILE` and mock screening data | Used as fallback in `phc.ts` when API call fails |

---

## 4. Dual Database Consistency Analysis

| Aspect | Backend MongoDB (`dr_screening`) | Frontend MongoDB (Atlas) |
|---|---|---|
| **Auth Users** | Not stored | `users` collection |
| **PHC Profiles** | Not stored (mock in `phc.py`) | `phcs` collection |
| **Patients** | `patients` collection | Not stored |
| **Screenings** | `screenings` collection | Not stored |
| **OTPs** | Not stored | `otps` collection |

**Key finding:** There is zero cross-reference between the two databases. A user logs in via Atlas → gets `phcId` → but `phcId` is never sent to the backend. The backend operates on a completely separate patient/screening universe. This is by design for MVP but means:
- Multiple users share the same backend data (no tenant isolation)
- The backend `GET /api/phc/profile` returns mock data and is never called by the frontend
- PHC profile on reports comes from Atlas via Next.js `/api/phc`, not from backend

---

## 5. Frontend ↔ Backend Field Contract

### Request/Response Transformations (`backendClient.ts`)

| Direction | Transformation | Example |
|---|---|---|
| Request → Backend | `camelToSnake()` | `{ patientId: "PAT-001" }` → `{ patient_id: "PAT-001" }` |
| Backend → Response | `snakeToCamel()` | `{ screening_id: "SCR-001" }` → `{ screeningId: "SCR-001" }` |
| Backend → Response | Confidence × 100 | `{ confidence: 0.87 }` → `{ confidence: 87 }` |
| Backend → Response | Risk level uppercased | `{ level: "high" }` → `{ level: "HIGH RISK" }` |
| Backend → Response | Status remapped | `"created"` / `"image_uploaded"` → `"pending"` |
| Backend → Response | Heatmap URL extracted | `explanation.heatmap_url` → `heatmapUrl` |
| Backend → Response | Date mapped | `created_at` → `date` |
| Backend → Response | Grade labels injected | `_enrich_screening()` adds `label` + `description` to `prediction` |
| Backend → Response | Patient details injected | `_enrich_screening()` adds `patient_name`, `patient_age`, `patient_gender`, `diabetes_duration_years` |

### Known Inconsistencies

| # | Issue | Severity |
|---|---|---|
| 1 | Risk level `"monitor"` maps to Frontend `"MONITOR"` but UI risk filter dropdown only has `LOW RISK`, `HIGH RISK`, `URGENT`, `RECAPTURE` — **"MONITOR" has no filter option** | Medium |
| 2 | Screening history filtering is **client-side** for text search, but **server-side** for risk/grade via query params — mixed approach | Low |
| 3 | Backend `GET /api/phc/profile` exists but is **never called** by frontend — dead endpoint | Low |
| 4 | `quality_check_endpoint` (`POST /{id}/quality`) exists as a standalone endpoint but the `analyze_endpoint` runs quality check inline — the standalone endpoint is **never called** by frontend | Low |
| 5 | `mockData.ts` `INITIAL_PHC_PROFILE` is used as fallback in `phc.ts` `getPHCProfile()` — could show stale mock data if API fails silently | Medium |

---

## 6. API Endpoint Usage Map

### Backend Endpoints — Called by Frontend

| Endpoint | Called By | Via |
|---|---|---|
| `POST /api/patients` | `registerPatient()` | `backendClient.ts` |
| `GET /api/patients` | `getPatients()` | `backendClient.ts` |
| `GET /api/patients/{id}` | `getPatientById()` | `backendClient.ts` |
| `GET /api/patients/{id}/screenings` | `getScreeningsByPatientId()` | `backendClient.ts` |
| `POST /api/screenings` | `createScreening()` | `backendClient.ts` |
| `POST /api/screenings/{id}/image` | `uploadScreeningImage()` | `backendClient.ts` |
| `POST /api/screenings/{id}/analyze` | `analyzeScreening()` | `backendClient.ts` |
| `GET /api/screenings/{id}` | `getScreeningResult()` | `backendClient.ts` |
| `GET /api/screenings` | `getScreeningHistory()` | `backendClient.ts` |

### Backend Endpoints — NOT Called by Frontend (Dead)

| Endpoint | Reason |
|---|---|
| `POST /api/screenings/{id}/quality` | `analyze_endpoint` runs quality inline; standalone endpoint is orphaned |
| `GET /api/reports/summary` | Frontend generates stats client-side from screening/patient data |
| `GET /api/phc/profile` | Frontend uses Atlas via Next.js `/api/phc` instead |

### Next.js API Routes — Usage

| Route | Called By | Database |
|---|---|---|
| `POST /api/register` | `RegisterForm` | Atlas |
| `POST /api/auth/verify-otp` | `VerifyOTPForm` | Atlas |
| `POST /api/auth/resend-otp` | `VerifyOTPForm` | Atlas |
| `POST /api/auth/forgot-password` | `ForgotPasswordForm` | Atlas |
| `POST /api/auth/reset-password` | `ResetPasswordForm` | Atlas |
| `GET/POST /api/auth/[...nextauth]` | NextAuth | Atlas |
| `GET /api/phc` | `getPHCProfile()` | Atlas |
| `PUT /api/phc` | `updatePHCProfile()` | Atlas |
| `POST /api/chat` | **Nothing** | None (deprecated) |

---

## 7. Auth Flow Summary

### Unprotected Routes (no auth required)
- `/login` — redirects to `/dashboard` if already logged in
- `/register` — redirects to `/dashboard` if already logged in
- `/api/register` — open endpoint
- `/api/auth/*` — OTP, password reset endpoints

### Protected Routes (middleware enforced)
- `/dashboard/*` — requires valid NextAuth session JWT
- Backend API routes (`/api/backend/*`) — **completely unprotected** (no auth header forwarded)

### Auth Data Flow
```
Browser → NextAuth signIn() → auth.config.ts authorize() → Atlas users collection
       → JWT token created with { id, email, name, phcId, role }
       → Session callback exposes { user: { id, phcId, role } }
       → Middleware checks JWT on /dashboard/* routes
       → Backend API calls: NO auth token forwarded (open)
```

---

*End of Phase 2 — Feature Mapping Report*

---

# DAY 1 — Phase 3: Data Flow Verification Report

**Date:** 2026-08-26
**Scope:** Schema-by-schema comparison of backend Pydantic models ↔ MongoDB documents ↔ frontend TypeScript types, plus all transformation/mapping functions
**Status:** Complete

---

## 1. Schema Comparison Matrix

### 1.1 Patient Schema

| Field | Backend `PatientResponse` | Backend MongoDB doc | Frontend `Patient` | `toPatient()` transform | Status |
|---|---|---|---|---|---|
| `patient_id` | `patient_id: str` | `patient_id: str` (e.g. `P-0001`) | `id: string`, `patientId: string` | `c.patientId` → both `id` and `patientId` | **OK** (duplication intentional) |
| `name` | `name: str` | `name: str` | `name: string` | pass-through | OK |
| `age` | `age: int` | `age: int` | `age: number` | pass-through | OK |
| `gender` | `gender: str` | `gender: str` (lowercase from form) | `gender: 'Male' \| 'Female' \| 'Other'` | pass-through (no capitalization) | **MINOR** — mock data uses "Female", form sends lowercase; frontend does not enforce casing |
| `diabetes_duration_years` | `Optional[int]` | `int \| None` | `diabetesDurationYears: number` | `c.diabetesDurationYears \|\| 0` | OK |
| `contact_number` | `Optional[str]` | `str \| None` | `contactNumber?: string` | `c.contactNumber \|\| undefined` | OK |
| `created_at` | `created_at: str` | ISO 8601 string | `createdAt: string` | pass-through | OK |

**Verdict:** Patient schema is clean. `toPatient()` correctly maps all fields. Minor: no gender casing normalization.

---

### 1.2 Screening Schema — **CRITICAL MISMATCHES**

#### 1.2.1 Backend Pydantic `ScreeningResponse` vs Actual Endpoint Response

The `ScreeningResponse` Pydantic model (`backend/app/schemas/screening.py:10-16`) defines only:

```python
class ScreeningResponse(BaseModel):
    screening_id: str
    patient_id: str
    eye: str
    status: str
    image_url: Optional[str] = None
    created_at: str
```

But the endpoint `GET /api/screenings/{screening_id}` (`backend/app/api/screenings.py:157-178`) returns a **dict** with 13 fields including `patient_name`, `patient_age`, `patient_gender`, `diabetes_duration_years`, `image_quality`, `prediction`, `explanation`, `risk`.

Because the endpoint function returns a raw dict (not a `ScreeningResponse` instance), FastAPI serializes it via `jsonable_encoder` without Pydantic model filtering. **All 13 fields reach the frontend.** However, this is fragile — if someone refactors the endpoint to return `ScreeningResponse(...)` explicitly, 7 fields would be silently dropped.

> **ISSUE S3.1: `ScreeningResponse` Pydantic model is incomplete.** It only declares 6 fields while the actual endpoint returns 13. Not a runtime bug today, but a latent breakage risk. The model should include all fields the endpoint returns.

#### 1.2.2 Backend `Result.ScreeningResult` vs Frontend `ScreeningResult`

| Field | Backend `result.py` | Backend actual data | Frontend `ScreeningResult` | Transform | Status |
|---|---|---|---|---|---|
| screening id | `screening_id: str` | `SCR-0001` | `screeningId: string` | `raw.screening_id` | OK |
| patient id | `patient_id: str` | `P-0001` | `patientId: string` | `raw.patient_id` | OK |
| patient name | *(missing)* | injected by `_enrich_screening` | `patientName: string` | `raw.patient_name` | OK |
| patient age | *(missing)* | injected by `_enrich_screening` | `patientAge: number` | `raw.patient_age` | OK |
| patient gender | *(missing)* | injected by `_enrich_screening` | `patientGender: string` | `raw.patient_gender` | OK |
| diabetes duration | *(missing)* | injected by `_enrich_screening` | `diabetesDurationYears: number` | `raw.diabetes_duration_years` | OK |
| date | *(missing)* | `created_at` from MongoDB | `date: string` | `raw.created_at` | OK |
| eye | `eye: str` | `"left"` or `"right"` | `eye: 'left' \| 'right'` | pass-through | OK |
| image url | `image_url: Optional[str]` | URL string | `imageUrl: string` | `raw.image_url` | OK |
| heatmap url | *(missing)* | `explanation.heatmap_url` | `heatmapUrl?: string` | `explanation.heatmap_url` | OK |
| image quality | `image_quality: Optional[Dict]` | quality dict | `imageQuality: ImageQualityCheck` | `toImageQuality()` | **SEE 1.3** |
| prediction | `prediction: Optional[Prediction]` | prediction dict | `prediction?: DRPrediction` | `toPrediction()` | **SEE 1.4** |
| risk | `risk: Optional[Risk]` | risk dict | `risk?: RiskAssessment` | `toRisk()` | **SEE 1.5** |
| status | `status: str` | backend state string | `status: 'completed' \| 'quality_failed' \| 'pending'` | `mapScreeningStatus()` | OK |

---

### 1.3 Image Quality Schema — **3 BUGS**

Backend `QualityResult` (quality.py + quality_service.py):
```python
{
    "status": "good" | "poor",       # ← backend values
    "score": 0.0-1.0,                 # ← DECIMAL (0 to 1)
    "checks": {
        "resolution": bool,
        "brightness": bool,
        "contrast": bool,
        "blur": bool,
        # NO fundusVisibility
    },
    "issues": ["..."],                 # ← list of strings
    "action": "recapture" | None       # ← not used by frontend
}
```

Frontend `ImageQualityCheck` (types.ts):
```typescript
{
    status: 'good' | 'insufficient',  // ← frontend values
    score: number,                     // ← PERCENTAGE (0-100)
    checks: {
        resolution: boolean,
        brightness: boolean,
        contrast: boolean,
        blur: boolean,
        fundusVisibility: boolean,     // ← MISSING from backend
    },
    issues?: string[],
    message: string,                   // ← MISSING from backend
}
```

| Issue ID | Severity | Description |
|---|---|---|
| **S3.2** | **HIGH** | **Quality `score` not scaled.** Backend returns `0.0–1.0` (e.g. `0.75`), frontend expects `0–100` (e.g. `75`). The `toImageQuality()` function at `backendClient.ts:84` does `score: (raw.score as number) \|\| 0` with **no conversion**. Confidence gets `×100` conversion (`backendClient.ts:106`), but quality score does not. All quality scores displayed in the UI will be 100× too low (e.g. `0.75` displayed as "75%" score label but `0.75` internally). **Whether this manifests as a visible bug depends on how the frontend renders it** — if it displays `score` directly, it shows `0.75`; if it divides by 100, it shows `0.0075`. |
| **S3.3** | **MEDIUM** | **`fundusVisibility` always `true`.** `toImageQuality()` at `backendClient.ts:91` hardcodes `checks.fundusVisibility ?? true`. The backend never produces this field. The value is always `true` regardless of actual image quality. This means the `fundusVisibility` check in the UI is cosmetic only — it never flags poor fundus visibility. |
| **S3.4** | **LOW** | **`message` always empty.** `toImageQuality()` at `backendClient.ts:94` does `(raw.message as string) \|\| ""`. The backend never produces a `message` field (it has `issues[]` and `action` instead). The `message` property will always be `""`. If any UI component displays `imageQuality.message`, it will show nothing. |
| **S3.5** | **LOW** | **Status value mismatch.** Backend sends `"poor"`, frontend type allows `'good' \| 'insufficient'`. The `toImageQuality()` mapper (`backendClient.ts:84`) falls through to `"insufficient"` for any non-`"good"` value, so `"poor"` → `"insufficient"` works correctly at runtime. But the backend Pydantic schema `QualityResult.status` is `str` (unconstrained), so there is no compile-time guarantee. |

---

### 1.4 DR Prediction Schema

Backend `result.py Prediction`:
```python
grade: int          # 0-4
label: str          # e.g. "Moderate DR" (injected by _enrich_screening from GRADE_LABELS)
confidence: float   # 0.0-1.0 (decimal)
```

Note: `Prediction` does **not** have `description`. The `_enrich_screening()` function (`screenings.py:36-41`) adds `description` from `GRADE_DESCRIPTIONS` if missing.

Frontend `DRPrediction`:
```typescript
grade: DRGrade;              // 0 | 1 | 2 | 3 | 4
label: 'No DR' | 'Mild DR' | 'Moderate DR' | 'Severe DR' | 'Proliferative DR';
description: string;         // ← injected by backend enrichment
confidence: number;          // percentage (0-100)
```

| Issue ID | Severity | Description |
|---|---|---|
| **S3.6** | **OK (by design)** | **`description` added by `_enrich_screening`.** The raw `Prediction` has no `description` field, but `_enrich_screening()` injects it from `GRADE_DESCRIPTIONS`. This works correctly for all happy paths. However, in the `quality_failed` path (`screenings.py:115-124`), the result dict has **no `prediction`** key at all — so `description` is irrelevant for quality-failed screenings. |
| — | OK | **Confidence conversion correct.** `toPrediction()` at `backendClient.ts:106`: `confidence <= 1 ? Math.round(confidence * 1000) / 10 : confidence`. Converts `0.914` → `91.4`. The `×1000/10` pattern preserves one decimal place. |

---

### 1.5 Risk Schema — **2 BUGS + 1 INCONSISTENCY**

Backend `risk_service.py RISK_MAP` produces dicts with **4 fields**:
```python
{
    "level": "low" | "monitor" | "high" | "urgent" | "recapture",
    "recommendation": str,
    "action_required": str,        # ← snake_case
    "follow_up_timeframe": str,    # ← snake_case
}
```

Backend `result.py Risk` Pydantic model defines only **2 fields**:
```python
class Risk(BaseModel):
    level: str
    recommendation: str
```

Frontend `RiskAssessment`:
```typescript
{
    level: RiskLevel;              // 'LOW RISK' | 'MONITOR' | 'HIGH RISK' | 'URGENT' | 'RECAPTURE'
    recommendation: string;
    actionRequired: string;        // ← camelCase
    followUpTimeframe: string;     // ← camelCase
}
```

| Issue ID | Severity | Description |
|---|---|---|
| **S3.7** | **MEDIUM** | **`Risk` Pydantic model is incomplete.** The `result.py Risk` model only has `level` and `recommendation`, but the actual risk dict from `risk_service.py` also has `action_required` and `follow_up_timeframe`. Like S3.1, the risk dict passes through as raw JSON today, but the Pydantic model doesn't reflect reality. If `Result.ScreeningResult` is ever validated strictly, `action_required` and `follow_up_timeframe` would be dropped. |
| **S3.8** | **MEDIUM** | **`"monitor"` risk level has no frontend filter.** `RISK_MAP[1]` produces `level: "monitor"`. Frontend `RISK_LEVEL_MAP` maps `"monitor"` → `"MONITOR"`. The `RiskLevel` type includes `'MONITOR'`. **BUT** the screening history page (`screenings/page.tsx`) risk filter dropdown does **not** include a "MONITOR" option — only "Low Risk", "Moderate Risk", "High Risk", "Urgent", and "Recapture". Grade 1 (Mild DR) screenings with `MONITOR` risk level **cannot be filtered** in the UI. They also fall into the `else` bucket in dashboard stats (`page.tsx:57-60`) — not counted as "At Risk" nor "No DR". |
| **S3.9** | **LOW** | **Risk `level` casing is consistent through the pipeline.** Backend sends lowercase (`"low"`, `"high"`), `toRisk()` at `backendClient.ts:114` maps via `RISK_LEVEL_MAP` to UPPERCASE (`"LOW RISK"`, `"HIGH RISK"`). Dashboard filtering at `page.tsx:58` checks `s.risk?.level === 'HIGH RISK'` — matches. This is correct. |

---

### 1.6 Quality Failed Path — **MISSING PREDICTION FIELD**

In the `quality_failed` branch of `analyze_endpoint` (`screenings.py:112-124`):
```python
result = {
    "screening_id": screening_id,
    "patient_id": screening["patient_id"],
    "eye": screening["eye"],
    "status": "quality_failed",
    "image_url": screening.get("image_url"),
    "image_quality": quality,
    "risk": risk,              # risk from get_poor_image_risk()
    # NO prediction key
    # NO explanation key
}
```

The frontend `toScreening()` handles this: `prediction` defaults to `undefined`, `heatmapUrl` defaults to `undefined`. The screening result page (`[screeningId]/page.tsx`) shows "Quality Issue" and "Recapture Required" for `quality_failed` status. **This path works correctly.**

---

## 2. Transformation Function Audit

### 2.1 `snakeToCamel()` — `backendClient.ts:35-37`
```typescript
function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
```
- **Coverage:** Applied only in `convertKeys()`, which is used by `toPatient()`.
- **NOT used** by `toScreening()` — screening fields are mapped manually via `raw.screening_id`, `raw.patient_id`, etc.
- **Correctness:** For patient fields (`diabetes_duration_years` → `diabetesDurationYears`), this works. Edge cases: `_id` → `id` (not relevant here since `_id` is excluded by MongoDB projection).

### 2.2 `toPatient()` — `backendClient.ts:59-71`
- Both `id` and `patientId` are set to `c.patientId` — the backend `patient_id` field.
- The backend generates IDs like `P-0001`. Mock data has `PAT-2026-0891`. Frontend uses the backend value.
- **Correct.**

### 2.3 `toScreening()` — `backendClient.ts:121-139`
- Reads raw snake_case keys directly (`raw.screening_id`, `raw.patient_name`, etc.) — does NOT use `convertKeys()`.
- `date` mapped from `raw.created_at` — correct.
- `heatmapUrl` extracted from nested `raw.explanation.heatmap_url` — correct.
- **Correct.** No issues found.

### 2.4 `toImageQuality()` — `backendClient.ts:73-96`
- **S3.2:** Score not scaled (0.0-1.0 passed through as-is).
- **S3.3:** `fundusVisibility` hardcoded to `true`.
- **S3.4:** `message` always `""`.
- **S3.5:** Status `"poor"` → `"insufficient"` works via fallthrough.
- **Issues array:** Backend `issues[]` is passed through as `issues` — correct.

### 2.5 `toPrediction()` — `backendClient.ts:98-108`
- `description` read from `raw.description` — only present because `_enrich_screening()` injects it. If called on a raw prediction without enrichment, `description` would be `""`.
- Confidence conversion: `0.914` → `91.4` — correct.
- **Correct.**

### 2.6 `toRisk()` — `backendClient.ts:110-119`
- `RISK_LEVEL_MAP` correctly maps all 5 backend level strings.
- `actionRequired`: tries `raw.actionRequired` first (already camelCase from `convertKeys`), then falls back to `raw.action_required`. Since `toScreening()` doesn't use `convertKeys()`, the data arrives as `action_required` — the fallback catches it. **Correct but fragile.**
- `followUpTimeframe`: same dual-lookup pattern — correct.
- **Correct.**

### 2.7 `mapScreeningStatus()` — `backendClient.ts:141-147`
- Maps `"completed"` → `"completed"`, `"quality_failed"` → `"quality_failed"`, everything else → `"pending"`.
- Backend states `created`, `image_uploaded`, `quality_checking`, `ai_processing`, `failed` all collapse to `"pending"`.
- Frontend type allows only `'completed' | 'quality_failed' | 'pending'`.
- **Correct.** The `"failed"` backend state maps to `"pending"` in the frontend, which is semantically misleading but acceptable for MVP.

---

## 3. Dashboard Stats Logic Audit — `app/dashboard/page.tsx`

| Stat | Logic | Potential Issue |
|---|---|---|
| `totalScreened` | `screenings.length` | Correct — counts all screenings regardless of status |
| `noDrCount` | `s.prediction?.grade === 0` | Only counts completed screenings (quality_failed have no prediction, so `?.grade` is undefined → false). **Correct.** |
| `atRiskCount` | `s.risk?.level === 'HIGH RISK' \|\| s.risk?.level === 'URGENT'` | Grade 2 (`"high"` → `"HIGH RISK"`) and Grade 3 (`"high"` → `"HIGH RISK"`) are counted. Grade 4 (`"urgent"` → `"URGENT"`) is counted. Grade 1 (`"monitor"` → `"MONITOR"`) is **NOT counted** — falls through. **This matches the "Moderate / Severe DR" label, so it's arguably correct by design.** |
| `referralCount` | Same as `atRiskCount` | **Redundant variable** — `referralCount` is always equal to `atRiskCount`. Both use the exact same filter condition. Not a bug, but dead code. |
| `phc?.name` | Falls back to hardcoded `'Alandi Rural Primary Health Centre'` | Acceptable for MVP |

---

## 4. Screening History Page Filtering — `app/dashboard/screenings/page.tsx`

The screening history page (`screenings/page.tsx`) uses **hybrid filtering**:
- **Backend filters** (via API query params): `risk`, `grade`, `date_from`, `date_to`
- **Frontend filters** (client-side `.filter()`): `search` (patient name/ID), `riskLevel`, `drGrade`, `dateRange`

**Inconsistency S3.10:** When the user selects a risk filter dropdown, the frontend does client-side filtering by comparing `s.risk?.level` against the selected UPPERCASE string. But the backend also supports `risk` query param which uses **lowercase** values (`"low"`, `"high"`). These two filter paths are **not connected** — the frontend never sends the risk filter to the backend API. All filtering is client-side.

Similarly for `drGrade` — the frontend does `s.prediction?.grade === Number(filter.drGrade)` client-side, while the backend supports `grade` query param. Again, not connected.

**Impact:** Works for MVP with small datasets. For production with large screening volumes, this means all screenings are fetched (up to `limit`) and filtered in the browser — a performance concern but not a correctness bug.

---

## 5. API Response Shape Audit — Endpoint vs Schema vs Client

| Endpoint | Pydantic `response_model` | Actual dict keys returned | Client reads | Discrepancy |
|---|---|---|---|---|
| `POST /screenings` | `ScreeningResponse` (6 fields) | `_enrich_screening()` → 13 fields | `toScreening()` reads 13 fields | **S3.1** — Pydantic model too narrow |
| `GET /screenings/{id}` | None (manual dict) | 13 fields | `toScreening()` reads 13 fields | OK (no response_model) |
| `GET /screenings` | None (manual dict) | items[] each 13 fields | `toScreening()` on each | OK |
| `POST /screenings/{id}/image` | None | `{screening_id, image_uploaded, image_url}` | `res.json()` raw | OK |
| `POST /screenings/{id}/analyze` | None | `_enrich_screening()` → varies | `toScreening()` | OK |
| `POST /screenings/{id}/quality` | None | quality dict (6 fields) | **Not called by frontend** | Orphan endpoint (Phase 2 finding) |
| `GET /reports/summary` | None | snake_case dict | `fetchReportsSummary()` with manual camelCase | OK |
| `GET /patients` | None | `{items: [...], total}` | `toPatient()` on each | OK |
| `POST /patients` | None | patient dict | `toPatient()` | OK |
| `GET /patients/{id}` | None | patient dict | `toPatient()` | OK |

---

## 6. Complete Issue Register — Phase 3

| ID | Severity | Category | Description | File:Line |
|---|---|---|---|---|
| **S3.1** | MEDIUM | Schema gap | `ScreeningResponse` Pydantic model has 6 fields, endpoint returns 13. Latent breakage risk if endpoint is refactored. | `schemas/screening.py:10-16` |
| **S3.2** | **HIGH** | Data conversion | Quality `score` not scaled from 0-1 to 0-100. Backend returns `0.75`, frontend expects `75`. `toImageQuality()` has no conversion (unlike `toPrediction()` which does `×100`). | `backendClient.ts:84` |
| **S3.3** | MEDIUM | Synthetic field | `fundusVisibility` hardcoded to `true` — never reflects actual quality check. | `backendClient.ts:91` |
| **S3.4** | LOW | Missing data | `message` always `""` — backend produces `issues[]` and `action`, not `message`. | `backendClient.ts:94` |
| **S3.5** | LOW | Type mismatch | Backend status `"poor"` not in frontend type `'good' \| 'insufficient'`. Works via fallthrough but no compile-time safety. | `backendClient.ts:84` |
| **S3.6** | OK | By design | `description` injected by `_enrich_screening()` — works correctly. | `api/screenings.py:36-41` |
| **S3.7** | MEDIUM | Schema gap | `Risk` Pydantic model has 2 fields, actual risk dict has 4. `action_required` and `follow_up_timeframe` pass through as raw dict keys. | `schemas/result.py:16-18` |
| **S3.8** | MEDIUM | UX gap | Grade 1 (Mild DR) → `"monitor"` risk level has no filter option in screening history dropdown. These screenings are unfilterable. | `app/dashboard/screenings/page.tsx` |
| **S3.9** | OK | Consistent | Risk level casing pipeline (lowercase → UPPERCASE via `RISK_LEVEL_MAP`) is correct end-to-end. | — |
| **S3.10** | LOW | Architecture | Screening history filtering is hybrid: backend supports `risk`/`grade` query params but frontend does all filtering client-side. Works for MVP, scales poorly. | `screenings/page.tsx` |
| **S3.11** | LOW | Dead code | `referralCount` in dashboard is always equal to `atRiskCount` — redundant variable. | `app/dashboard/page.tsx:60` |

---

## 7. Data Flow Diagram — Full Pipeline

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         NEW SCREENING FLOW                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Frontend                              Backend                            │
│  ─────────                             ───────                            │
│  runFullScreening()                                                  │
│    │                                                                 │
│    ├─ createScreening(patientId, eye)                                │
│    │   POST /screenings { patient_id, eye }                          │
│    │                        ─────────────────►  create_screening()    │
│    │                                             MongoDB insert       │
│    │   ◄──── ScreeningResponse (6 fields via Pydantic) ─────         │
│    │   BUT: endpoint returns raw dict with 13 fields                 │
│    │   (S3.1: Pydantic model is too narrow)                          │
│    │                                                                 │
│    ├─ uploadScreeningImage(screeningId, file)                        │
│    │   POST /screenings/{id}/image  (multipart)                     │
│    │                        ─────────────────►  save_image()         │
│    │   ◄──── { image_url: "..." } ──────────────────────────        │
│    │                                                                 │
│    ├─ analyzeScreening(screeningId)                                  │
│    │   POST /screenings/{id}/analyze                                │
│    │                        ─────────────────►  quality checks       │
│    │   IF poor:              assess_image_quality()                  │
│    │     risk = get_poor_image_risk() → { level:"recapture", ... }   │
│    │     status → "quality_failed"                                   │
│    │     return _enrich_screening(result)                            │
│    │                                                                 │
│    │   IF good:                                                     │
│    │     prediction = run_inference() → { grade, label, confidence } │
│    │     heatmap = generate_gradcam() → URL                         │
│    │     risk = map_grade_to_risk(grade) → { level, recommendation, │
│    │              action_required, follow_up_timeframe }              │
│    │     _enrich_screening() adds:                                   │
│    │       patient_name, patient_age, patient_gender,                │
│    │       diabetes_duration_years, description, label               │
│    │     return dict with 13 fields                                  │
│    │                                                                 │
│    │   ◄──── Raw JSON (13 keys, snake_case) ──────────────────      │
│    │                                                                 │
│    ▼                                                                 │
│  toScreening(raw)                                                    │
│    │                                                                 │
│    ├─ screeningId  ◄ raw.screening_id                                │
│    ├─ patientId    ◄ raw.patient_id                                  │
│    ├─ patientName  ◄ raw.patient_name (enriched)                     │
│    ├─ date         ◄ raw.created_at                                  │
│    ├─ imageUrl     ◄ raw.image_url                                   │
│    ├─ heatmapUrl   ◄ raw.explanation.heatmap_url                     │
│    ├─ imageQuality ◄ toImageQuality(raw.image_quality)               │
│    │   └─ S3.2: score NOT scaled (0.75 not 75)                       │
│    │   └─ S3.3: fundusVisibility = true (hardcoded)                  │
│    │   └─ S3.4: message = "" (always empty)                          │
│    ├─ prediction   ◄ toPrediction(raw.prediction)                    │
│    │   └─ confidence: 0.914 → 91.4 ✓                                 │
│    ├─ risk         ◄ toRisk(raw.risk)                                │
│    │   └─ level: "high" → "HIGH RISK" ✓                              │
│    │   └─ actionRequired ← raw.action_required ✓                     │
│    └─ status       ◄ mapScreeningStatus(raw.status)                  │
│                                                                          │
│  Result: ScreeningResult object for React state                         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

*End of Phase 3 — Data Flow Verification Report*

---
---

# PHASE 4 — Security Audit Report

**Date:** 2026-08-26
**Scope:** Full-stack security posture: authentication, authorization, injection, secrets, file handling, CORS, rate limiting, headers.
**Files inspected:** `backend/app/main.py`, `backend/app/core/config.py`, `backend/app/api/*.py`, `backend/app/services/*.py`, `Frontend/auth.ts`, `Frontend/auth.config.ts`, `Frontend/middleware.ts`, `Frontend/lib/otp.ts`, `Frontend/lib/email.ts`, `Frontend/lib/validations.ts`, `Frontend/lib/mongodb.ts`, `Frontend/app/api/**/*.ts`, `Frontend/next.config.ts`, `.env*`, `.gitignore`

---

## Executive Summary

The application has **one critical, two high, four medium, and four low** severity security issues. The most severe is **secrets committed to the filesystem** (though gitignored). The backend has **zero authentication** on all endpoints. The frontend auth layer (NextAuth + MongoDB Atlas) is well-constructed but the two databases are entirely disconnected security-wise.

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 1 | Active |
| HIGH | 2 | Active |
| MEDIUM | 4 | Active |
| LOW | 4 | Active |
| **OK** | 6 | Passed |

---

## S4.1 — CRITICAL: Secrets in .env.local on Disk

**File:** `Frontend/.env.local:3-27`
**Status:** ⚠ ACTIVE

The `.env.local` file contains production-grade secrets in plaintext:

```
MONGODB_URI=mongodb+srv://vikaschoudhary7058_db_user:9XqprEPTOmUVPxiz@cluster0.z04lboh.mongodb.net/
AUTH_SECRET=550aa906655b827b0b861b509b2410b5bf49978798e0c707443d5ba3a6a83986
GOOGLE_CLIENT_ID=595785343611-...
GOOGLE_CLIENT_SECRET=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
EMAIL_SERVER_PASSWORD=xsmtpsib-7434e26f61ead62db25b3b1214eccdb6d3a489056aaeed7b7b18cab54d1952c3-pizgpLMEPpkDoW2l
```

**Mitigation (partial):** Both `Frontend/.gitignore` (line 34: `.env*`) and `backend/.gitignore` (line 4: `.env`) exclude these from git. However:
- The files exist on disk and contain real credentials
- If the repo is ever force-pushed or the gitignore is edited, these leak immediately
- The MongoDB Atlas URI has IP allowlisting — verify it's restricted
- Brevo SMTP key is valid and could be used to send spam

**Recommendation:**
1. Rotate ALL secrets immediately (Google OAuth, Brevo SMTP, AUTH_SECRET)
2. Create `.env.local` with placeholder values; document the real values in a password manager
3. Add `.env*` to root-level `.gitignore` as a safety net

---

## S4.2 — HIGH: Backend Has Zero Authentication

**Files:** `backend/app/main.py`, all `backend/app/api/*.py`
**Status:** ⚠ ACTIVE

Every FastAPI endpoint is publicly accessible with no auth middleware:

| Endpoint | Method | Risk |
|----------|--------|------|
| `/api/patients` | POST | Anyone can create patients |
| `/api/patients` | GET | Anyone can list all patients |
| `/api/patients/{id}` | GET | Anyone can read any patient |
| `/api/patients/{id}/screenings` | GET | Anyone can read any patient's screenings |
| `/api/screenings` | POST | Anyone can create screenings |
| `/api/screenings/{id}/image` | POST | Anyone can upload images |
| `/api/screenings/{id}/quality` | POST | Anyone can trigger quality checks |
| `/api/screenings/{id}/analyze` | POST | Anyone can trigger AI analysis |
| `/api/reports/summary` | GET | Anyone can view aggregate stats |
| `/api/phc/profile` | GET/PUT | Anyone can read or overwrite PHC profile |
| `/health` | GET | Intentionally public ✓ |

The Next.js proxy (`/api/backend/*` → FastAPI) does NOT add auth headers. An attacker who discovers the backend port (8000) can bypass the frontend entirely.

**Impact:** Full data breach. Patient PII, medical images, and DR predictions accessible without any credentials.

**Recommendation:** Add JWT verification middleware to FastAPI that validates the NextAuth session token. Alternatively, bind FastAPI to `127.0.0.1` and add an API key for inter-service calls.

---

## S4.3 — HIGH: NoSQL Injection via Regex Search

**File:** `backend/app/services/patient_service.py:42`
**Status:** ⚠ ACTIVE

```python
query["name"] = {"$regex": search, "$options": "i"}
```

The `search` query parameter is passed directly into a MongoDB `$regex` operator without escaping special characters. An attacker can:

1. **ReDoS:** Send `(a+)+$` to cause catastrophic backtracking on the MongoDB server
2. **Data extraction:** Use regex patterns like `.*` to match all records
3. **Denial of service:** Craft patterns that consume excessive CPU

**Example attack:**
```
GET /api/patients?search=(?=.*secret)(?=.*admin)
```

**Mitigation:** The frontend uses Zod validation on its own forms but the backend endpoint receives the raw query parameter.

**Recommendation:** Escape regex special characters before interpolation:
```python
import re
escaped = re.escape(search)
query["name"] = {"$regex": escaped, "$options": "i"}
```
Or better, use MongoDB text indexes instead of regex.

---

## S4.4 — MEDIUM: No Rate Limiting on Auth Endpoints

**Files:** `Frontend/app/api/auth/verify-otp/route.ts`, `Frontend/app/api/auth/forgot-password/route.ts`, `LoginForm.tsx`
**Status:** ⚠ ACTIVE

**OTP brute force (partially mitigated):**
- `verify-otp` route correctly enforces `MAX_OTP_ATTEMPTS = 5` (line 39-45) ✓
- After 5 failed attempts, OTP record is deleted ✓
- `resend-otp` has a 60-second cooldown ✓

**Login brute force (NOT mitigated):**
- No rate limiting on `NextAuth.signIn('credentials', ...)` 
- No account lockout after N failed password attempts
- No CAPTCHA challenge
- Attacker can brute-force passwords indefinitely

**Password reset flooding (partially mitigated):**
- `forgot-password` returns generic response to prevent enumeration ✓
- But no cooldown between requests — attacker can flood email inbox with reset codes

**Recommendation:** Add rate limiting middleware (e.g., `next-rate-limit` or Redis-based) with at minimum:
- Login: 5 attempts per minute per IP
- Forgot-password: 3 requests per 15 minutes per email
- Verify-OTP: already handled ✓

---

## S4.5 — MEDIUM: Password Policy Too Weak for Healthcare

**File:** `Frontend/lib/validations.ts:15`
**Status:** ⚠ ACTIVE

```typescript
password: z.string().min(6, { message: 'Password must be at least 6 characters long' })
```

For a healthcare application handling **patient medical data** (DR screening results, patient PII, diabetes history), a 6-character minimum is insufficient.

**OWASP recommendation:** Minimum 8 characters with complexity requirements.
**Healthcare standard:** Minimum 12 characters recommended.

**Recommendation:** Enforce `min(12)` with at least one uppercase, one lowercase, and one number.

---

## S4.6 — MEDIUM: Static Files Served Without Access Control

**File:** `backend/app/main.py:62-63`
**Status:** ⚠ ACTIVE

```python
app.mount("/storage/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/storage/heatmaps", StaticFiles(directory=HEATMAP_DIR), name="heatmaps")
```

Uploaded fundus images and Grad-CAM heatmaps are served as static files with zero access control. URL pattern is predictable:
```
/storage/uploads/SCR-0001.jpg
/storage/heatmaps/SCR-0001_heatmap.jpg
```

**Impact:** Anyone who knows or guesses a screening ID can download patient medical images.

**Recommendation:** Serve files through an authenticated endpoint that checks session ownership, or use signed URLs with expiration.

---

## S4.7 — MEDIUM: CORS Allows All Methods and Headers

**File:** `backend/app/main.py:30-36`
**Status:** ⚠ ACTIVE (dev-safe, production-risk)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,      # "http://localhost:3000" ✓
    allow_credentials=True,
    allow_methods=["*"],              # ← overly permissive
    allow_headers=["*"],              # ← overly permissive
)
```

The origin restriction is correct (only `localhost:3000`), but wildcard methods and headers means any origin on port 3000 can make PUT/DELETE/PATCH requests. For production, restrict to `["GET", "POST", "PUT"]` and specific headers.

**Also:** `CORS_ORIGINS` is split from a single env var. In production, if this is changed to `*`, the entire CORS protection collapses.

---

## S4.8 — LOW: No Security Headers

**Files:** `backend/app/main.py`, `Frontend/next.config.ts`
**Status:** ⚠ ACTIVE

Neither the backend nor the frontend sets security headers:
- `Content-Security-Policy` — no CSP (XSS risk from Grad-CAM images)
- `X-Frame-Options` — clickjacking possible
- `X-Content-Type-Options` — MIME sniffing possible
- `Strict-Transport-Security` — no HSTS
- `Referrer-Policy` — no referrer control

**Recommendation:** Add via Next.js `headers()` config and FastAPI middleware.

---

## S4.9 — LOW: Sensitive Data in Error Logs

**Files:** `backend/app/main.py:44,50`, `Frontend/auth.ts:89,112`
**Status:** ⚠ ACTIVE

- `main.py:50`: `exc_info=True` logs full stack traces including internal paths
- `auth.ts:89`: `"Error saving Google user to MongoDB:" + error` — may log MongoDB connection strings
- `auth.ts:112`: `"Error fetching user for JWT:" + e` — same risk

**Impact:** If logs are accessible (e.g., dev tools, log aggregation without auth), internal paths and potentially connection strings leak.

**Recommendation:** Sanitize error messages before logging; never log full exception objects in production.

---

## S4.10 — LOW: `NEXTAUTH_URL=http://localhost:3000`

**File:** `Frontend/.env.local:16`
**Status:** ⚠ ACTIVE (dev-only)

With `NEXTAUTH_URL` set to localhost, session cookies will not have the `Secure` flag. In production, this MUST be changed to `https://<domain>` to ensure cookies are only sent over HTTPS.

---

## Security Checks PASSED

### S4.P1 — Gitignore Coverage ✓
- `Frontend/.gitignore:34` → `.env*` covers all env files
- `backend/.gitignore:4` → `.env` covers backend env
- Both `storage/uploads` and `storage/heatmaps` gitignored ✓

### S4.P2 — Input Validation on Auth Forms ✓
- All auth endpoints use Zod schemas: `registerSchema`, `loginSchema`, `verifyOtpSchema`, `forgotPasswordSchema`, `resetPasswordSchema`
- `bcrypt.compare` used for password verification (not plaintext) ✓
- Passwords hashed with `bcrypt.hash(password, 12)` ✓

### S4.P3 — OTP Implementation ✓
- Cryptographically random OTP: `crypto.randomInt(100000, 1000000)` ✓
- Hashed with bcrypt before storage ✓
- TTL index for automatic expiry: `expires: '0s'` ✓
- Attempt counter enforced in verify-otp and reset-password ✓
- Cooldown on resend: 60 seconds ✓
- Generic responses for password reset (no user enumeration) ✓

### S4.P4 — File Upload Validation ✓
- Content-type whitelist: `image/jpeg`, `image/jpg`, `image/png` ✓
- Size limit: `MAX_UPLOAD_SIZE_MB = 10` ✓
- OpenCV decode validation (not just content-type spoofing) ✓
- Safe filename: `{screening_id}{ext}` — no user-controlled filename ✓

### S4.P5 — Error Response Sanitization ✓
- Backend returns structured errors: `{"code": "...", "message": "..."}` ✓
- No stack traces in HTTP responses ✓
- Global exception handler catches unhandled errors ✓

### S4.P6 — MongoDB Connection Security ✓
- Backend: `mongodb://localhost:27017` — local only, no network exposure ✓
- Frontend: Atlas URI with auth credentials — verify IP allowlist is restrictive ✓
- No string interpolation in queries — uses PyMondo/Mongoose ODM ✓ (except S4.3 regex)

---

## Risk Summary Matrix

| ID | Severity | Category | Summary | Fix Effort |
|----|----------|----------|---------|------------|
| S4.1 | CRITICAL | Secrets | Real credentials in .env.local on disk | Low (rotate + template) |
| S4.2 | HIGH | Auth | Backend has zero authentication | Medium (add JWT middleware) |
| S4.3 | HIGH | Injection | Regex search not escaped (ReDoS) | Low (re.escape) |
| S4.4 | MEDIUM | Rate Limit | No login brute-force protection | Medium (rate limiter) |
| S4.5 | MEDIUM | Password | 6-char minimum too weak | Low (change validation) |
| S4.6 | MEDIUM | File Access | Medical images publicly accessible | Medium (auth endpoint) |
| S4.7 | MEDIUM | CORS | Wildcard methods/headers | Low (restrict list) |
| S4.8 | LOW | Headers | No CSP/X-Frame-Options/HSTS | Low (add headers) |
| S4.9 | LOW | Logging | Sensitive data in error logs | Low (sanitize) |
| S4.10 | LOW | Session | NEXTAUTH_URL=localhost (no Secure flag) | Low (env change) |

---

*End of Phase 4 — Security Audit Report*

---

# DAY 1 — Phase 5: Performance & Error Handling Audit

**Date:** 2026-08-26
**Scope:** N+1 queries, missing indexes, pagination gaps, client-side filtering, error handling consistency, image upload performance, loading state coverage
**Status:** Complete

---

## 1. Performance Issues

### S5.1 (MEDIUM) — N+1 Query in `_enrich_screening()`

**File:** `backend/app/api/screenings.py:26-42`

`_enrich_screening()` calls `get_patient(screening["patient_id"])` for **every single screening**. When `list_screenings_endpoint()` (line 200) calls `[_enrich_screening(item) for item in items]`, it fires N individual MongoDB queries for patient data.

**Impact:** 20-screening page = 20 extra DB round-trips. At 100 items per page (frontend hard-coded), this is 100 extra queries per list view.

**Fix:** Batch-load patients in a single query before enrichment, or use a MongoDB `$lookup` aggregation pipeline in `list_screenings()`.

---

### S5.2 (HIGH) — Zero MongoDB Indexes

**File:** `backend/app/core/database.py` + `services/screening_service.py`

No indexes are created anywhere. Collections in use:

| Collection | Fields queried | Missing index |
|------------|---------------|---------------|
| `screenings` | `prediction.grade`, `risk.level`, `created_at`, `patient_id` | All of them |
| `patients` | `patient_id`, `name` (regex) | `patient_id` (unique) |

`list_screenings()` at `screening_service.py:70` does `.sort("created_at", -1)` — without an index, MongoDB scans the full collection and sorts in memory.

**Fix:** Create compound indexes on common filter combinations and a unique index on `patient_id`.

---

### S5.3 (MEDIUM) — Pagination Exists but Is Never Used

**File:** `backend/app/api/screenings.py:188-206` + `Frontend/lib/api/screening.ts:50`

The backend supports `page` + `limit` query params and returns `{ items, total, page, limit, pages }`. But the frontend **hard-codes `limit: 100`** everywhere:

- `backendClient.ts:154` — `params.set("limit", "100")` for patients
- `backendClient.ts:201` — `limit: 100` for screenings
- `screening.ts:50` — `limit: 100` for history

No frontend page implements pagination UI (page numbers, "load more", or infinite scroll).

**Impact:** All data is loaded in one shot. Will not scale past ~100 records.

---

### S5.4 (MEDIUM) — Dashboard Computes Stats Client-Side

**File:** `Frontend/app/dashboard/page.tsx:31-45, 55-61`

The dashboard calls `getScreeningHistory()` (up to 100 screenings), loads them all into React state, then derives `totalScreened`, `noDrCount`, `atRiskCount`, `referralCount` via `.filter()` over the full array.

A dedicated `/reports/summary` endpoint already exists (`reports.py:7-9`, `screening_service.py:74-96`) that returns these exact counts server-side — but the dashboard doesn't use it.

**Fix:** Call `fetchReportsSummary()` for the stat cards; load only recent 10-20 screenings for the table.

---

### S5.5 (LOW) — `getPatientById()` Fallback Fetches All Patients

**File:** `Frontend/lib/api/patients.ts:16-21`

If `fetchPatient(id)` throws, the fallback does `fetchPatients()` (all patients) then `.find()` client-side. This is O(N) over the full patient list.

**Fix:** Remove the fallback or implement proper 404 handling on the caller side.

---

### S5.6 (MEDIUM) — `get_report_summary()` Issues 10 Sequential DB Queries

**File:** `backend/app/services/screening_service.py:74-96`

The summary endpoint runs `count_documents()` 8 times sequentially (1 total patients + 1 total screenings + 1 completed + 1 quality_failed + 5 grade counts + 5 risk counts = **12 queries**).

**Fix:** Use a single MongoDB aggregation pipeline with `$facet` to compute all counts in one round-trip.

---

### S5.7 (MEDIUM) — Screening History Text Search Is Client-Side Only

**File:** `Frontend/lib/api/screening.ts:54-62`

The backend `list_screenings()` has no text search capability. When the user types a search query, the frontend fetches all 100 screenings (already filtered by risk/grade) then filters by `patientName`, `patientId`, `screeningId` in JavaScript.

**Fix:** Add backend text search using `$text` index or `$regex` on the relevant fields, or at minimum accept a `search` query param that the backend can filter on.

---

### S5.8 (LOW) — Image Upload Holds Entire File in Memory

**File:** `backend/app/api/screenings.py:65-68`

```python
file_bytes = await file.read()  # loads entire file into RAM
max_bytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024
if len(file_bytes) > max_bytes:
    raise HTTPException(...)  # too late — already loaded
```

The 10MB file is fully read into memory *before* the size check. On a constrained deployment, this is a DoS vector.

**Fix:** Stream-read with a byte counter and abort early, or configure FastAPI's `UploadFile` max size at the middleware level.

---

### S5.9 (LOW) — No Debounce on Search Inputs

**File:** `Frontend/app/dashboard/screenings/page.tsx:16-32`

The `useEffect` fires `loadData()` on every keystroke in the search box (`search` state changes). No debounce/throttle is applied, meaning each keystroke triggers a full API call + re-render.

Similarly `Frontend/app/dashboard/page.tsx:157` — dashboard search fires on every keystroke (though this one filters client-side so it's less costly).

**Fix:** Add a 300ms debounce wrapper on the search input state.

---

## 2. Error Handling Issues

### S5.10 (MEDIUM) — All Frontend Errors Silently Swallowed

Every `useEffect` data loader in the frontend catches errors and does `console.error()` only:

| File | Line | What happens on error |
|------|------|-----------------------|
| `dashboard/page.tsx` | 39 | `console.error` → user sees spinner forever or stale data |
| `screening/[id]/page.tsx` | 40 | `console.error` → `screening` stays `null` → "Not Found" page |
| `screenings/page.tsx` | 26 | `console.error` → empty table, no feedback |
| `screening/new/page.tsx` | 72 | `console.error` → empty patient dropdown |
| `screening/new/page.tsx` | 182 | `console.error` → generic "Failed" text in `fileError` |

**Impact:** Users have no way to know *what* failed or *what to do* (retry? check connection? contact admin?). In a rural PHC setting, this is a real operational problem.

**Fix:** Add an error toast/notification system. Show retry buttons on failed data loads.

---

### S5.11 (MEDIUM) — Quick-Register Has No User Feedback

**File:** `Frontend/app/dashboard/screening/new/page.tsx:84-103`

```javascript
} catch (err) {
  console.error('Failed to quick-register patient:', err);
}
```

If patient registration fails (network error, validation error, backend down), the user gets **zero feedback** — the form just stays open. They may try submitting again, believing it didn't go through.

**Fix:** Show an inline error message on the form with the specific failure reason.

---

### S5.12 (MEDIUM) — No Global Backend Exception Handler

**File:** `backend/app/main.py`

The `main.py` exception handler only catches `RequestValidationError` (422). Any unhandled Python exception (e.g., a broken image file causing a PIL crash, a MongoDB connection timeout) returns FastAPI's **default HTML500 page** — which leaks stack traces in development mode and shows an ugly generic page in production.

**Fix:** Add `@app.exception_handler(Exception)` that returns a structured JSON error response.

---

### S5.13 (LOW) — No AI Inference Timeout

**File:** `backend/app/api/screenings.py:127-129`

```python
prediction = run_inference(screening["image_path"])
heatmap_url = generate_gradcam(screening["image_path"], screening_id)
```

If the CNN model (run by the other team) hangs or takes too long, the FastAPI request hangs indefinitely with no timeout. Combined with no retry logic, a single slow inference can block the worker thread.

**Fix:** Add configurable timeouts to inference calls; add retry with backoff.

---

### S5.14 (LOW) — Sequential AI Pipeline

**File:** `backend/app/api/screenings.py:108-154`

The analyze endpoint runs: quality check → update DB → inference → Grad-CAM → update DB. These are all sequential `update_screening()` calls + blocking service calls.

Quality check and inference could potentially run in parallel (quality check is on the image file, inference is on the same file but independent). Each `update_screening()` call is a separate DB write.

**Fix:** Batch DB updates; consider parallelizing quality check + inference if they're independent.

---

### S5.15 (LOW) — Screening Status Values Not Exhaustively Handled

**File:** `backend/app/api/screenings.py:131`

When inference fails:
```python
update_screening(screening_id, {"status": "failed"})
```

The frontend `mapScreeningStatus()` at `backendClient.ts:141-147` treats any non-`completed`/`quality_failed` status as `"pending"`. So a genuinely `"failed"` screening displays as "Pending" — misleading to PHC staff.

**Fix:** Add `"failed"` as an explicit status in the frontend type and show a "Failed — Retry" state.

---

## 3. Performance Summary Matrix

| ID | Severity | Issue | Category | Fix Effort |
|----|----------|-------|----------|------------|
| S5.1 | MEDIUM | N+1 queries in `_enrich_screening()` | DB Performance | Medium |
| S5.2 | HIGH | Zero MongoDB indexes | DB Performance | Low |
| S5.3 | MEDIUM | Pagination exists but unused | Scaling | Low |
| S5.4 | MEDIUM | Dashboard computes stats client-side | Redundant work | Low |
| S5.5 | LOW | Patient fallback fetches all | Client perf | Low |
| S5.6 | MEDIUM | 10 sequential count queries | DB Performance | Low |
| S5.7 | MEDIUM | Client-side text search | DB Performance | Medium |
| S5.8 | LOW | Full file in memory before size check | Memory | Low |
| S5.9 | LOW | No debounce on search input | UX | Low |
| S5.10 | MEDIUM | All errors silently swallowed | Error handling | Medium |
| S5.11 | MEDIUM | Quick-register no feedback | Error handling | Low |
| S5.12 | MEDIUM | No global backend exception handler | Error handling | Low |
| S5.13 | LOW | No AI inference timeout | Reliability | Low |
| S5.14 | LOW | Sequential AI pipeline | Performance | Medium |
| S5.15 | LOW | "failed" status shown as "pending" | UX | Low |

---

*End of Phase 5 — Performance & Error Handling Audit Report*

---

# DAY 1 — AUDIT SUMMARY: Phases 1–5

**Date:** 2026-08-26
**Total Issues Found:** 37
**Critical:** 1 | **High:** 4 | **Medium:** 18 | **Low:** 14

---

## Master Issue Table

| ID | Phase | Severity | Category | Summary | File / Line | Fix Effort |
|----|-------|----------|----------|---------|-------------|------------|
| S4.1 | 4 | **CRITICAL** | Secrets | Real credentials on disk in `.env.local` (gitignored but must rotate) | `Frontend/.env.local` | Low |
| S5.2 | 5 | **HIGH** | DB | Zero MongoDB indexes — full collection scans on every query | `backend/app/core/database.py` | Low |
| S4.2 | 4 | **HIGH** | Auth | Backend has zero authentication on all FastAPI endpoints | `backend/app/api/*` | Medium |
| S4.3 | 4 | **HIGH** | Injection | NoSQL injection via unescaped regex in patient search | `patient_service.py:42` | Low |
| S3.2 | 3 | **HIGH** | Data | Quality `score` not scaled 0–1 → 0–100; frontend shows `0.85 / 100` | `backendClient.ts:106` | Low |
| S3.1 | 3 | MEDIUM | Data | `ScreeningResponse` Pydantic has 6 fields, endpoint returns 13 | `schemas/screening.py` | Low |
| S3.3 | 3 | MEDIUM | Data | `fundusVisibility` hardcoded `true` — never actually computed | `backendClient.ts:91` | Low |
| S3.7 | 3 | MEDIUM | Data | `Risk` Pydantic has 2 fields, actual risk dict has 4 | `schemas/screening.py` | Low |
| S3.8 | 3 | MEDIUM | Data | Grade 1 `"monitor"` risk has no filter option in frontend dropdown | `screenings/page.tsx:70-75` | Low |
| S3.10 | 3 | MEDIUM | Data | Screening history filtering hybrid (backend params + client-side text) | `screening.ts:54-62` | Medium |
| S4.4 | 4 | MEDIUM | Rate Limit | No login brute-force rate limiting (OTP mitigates partially) | `Frontend/auth.ts` | Medium |
| S4.5 | 4 | MEDIUM | Password | 6-char minimum too weak for healthcare app | `Frontend/lib/validations.ts` | Low |
| S4.6 | 4 | MEDIUM | File Access | Medical images served as static files without access control | `backend/app/main.py` | Medium |
| S4.7 | 4 | MEDIUM | CORS | CORS allows wildcard methods and headers | `backend/app/main.py` | Low |
| S5.1 | 5 | MEDIUM | DB | N+1 queries — `_enrich_screening()` calls `get_patient()` per row | `screenings.py:28,200` | Medium |
| S5.3 | 5 | MEDIUM | Scaling | Pagination backend exists but frontend hard-codes `limit: 100` | `backendClient.ts:154,201` | Low |
| S5.4 | 5 | MEDIUM | Redundant | Dashboard computes stats client-side; `/reports/summary` exists unused | `dashboard/page.tsx:55-61` | Low |
| S5.6 | 5 | MEDIUM | DB | `get_report_summary()` runs 10 sequential count queries, no `$facet` | `screening_service.py:74-96` | Low |
| S5.7 | 5 | MEDIUM | DB | Screening history text search is client-side only | `screening.ts:54-62` | Medium |
| S5.10 | 5 | MEDIUM | Error | All frontend `useEffect` errors silently swallowed (`console.error` only) | `dashboard/page.tsx`, `screenings/page.tsx`, etc. | Medium |
| S5.11 | 5 | MEDIUM | Error | Quick-register patient has no user feedback on failure | `screening/new/page.tsx:100` | Low |
| S5.12 | 5 | MEDIUM | Error | No global backend exception handler; unhandled errors leak stack traces | `backend/app/main.py` | Low |
| S3.4 | 3 | LOW | Data | `message` always `""` — backend produces `issues[]` instead | `backendClient.ts:94` | Low |
| S3.5 | 3 | LOW | Data | Backend status `"poor"` not in frontend ScreeningStatus type | `backendClient.ts:141-147` | Low |
| S3.11 | 3 | LOW | Data | `referralCount` always equals `atRiskCount` (duplicate filter) | `dashboard/page.tsx:60` | Low |
| S4.8 | 4 | LOW | Headers | No CSP / X-Frame-Options / HSTS headers | `backend/app/main.py` | Low |
| S4.9 | 4 | LOW | Logging | Sensitive data (patient names, screening IDs) in request logs | `backend/app/main.py` | Low |
| S4.10 | 4 | LOW | Session | `NEXTAUTH_URL=localhost` — no Secure flag on auth cookies | `Frontend/.env.local` | Low |
| S5.5 | 5 | LOW | Client | `getPatientById()` fallback fetches all patients on 404 | `patients.ts:16-21` | Low |
| S5.8 | 5 | LOW | Memory | Full file read into RAM before size check on upload | `screenings.py:65-68` | Low |
| S5.9 | 5 | LOW | UX | No debounce on search inputs — every keystroke triggers API call | `screenings/page.tsx:16-32` | Low |
| S5.13 | 5 | LOW | Reliability | No AI inference timeout — request hangs if model hangs | `screenings.py:127-129` | Low |
| S5.14 | 5 | LOW | Performance | Sequential AI pipeline (quality → inference → Grad-CAM) | `screenings.py:108-154` | Medium |
| S5.15 | 5 | LOW | UX | Screening `"failed"` status shown as `"pending"` in frontend | `backendClient.ts:141-147` | Low |

---

## Issues by Severity

### CRITICAL (1)
| ID | Summary | Fix |
|----|---------|-----|
| S4.1 | Real secrets on disk (`.env.local`) | Rotate all credentials + add `.env.example` template |

### HIGH (4)
| ID | Summary | Fix |
|----|---------|-----|
| S5.2 | Zero MongoDB indexes | Add indexes on `screenings.patient_id`, `screenings.created_at`, `screenings.prediction.grade`, `screenings.risk.level`, `patients.patient_id` (unique) |
| S4.2 | Backend has zero auth | Add JWT middleware to all FastAPI routes |
| S4.3 | Regex injection in patient search | Use `re.escape()` on user input |
| S3.2 | Quality score not scaled 0–1 → 0–100 | Fix in `backendClient.ts:toImageQuality()` |

### MEDIUM (18)
| ID | Summary | Fix |
|----|---------|-----|
| S3.1 | ScreeningResponse Pydantic mismatch | Align schema with actual endpoint return shape |
| S3.3 | `fundusVisibility` hardcoded `true` | Compute from actual image analysis or remove |
| S3.7 | Risk Pydantic has 2 fields, actual has 4 | Extend `Risk` schema to include `actionRequired`, `followUpTimeframe` |
| S3.8 | Grade 1 "MONITOR" missing from dropdown | Add `"MONITOR"` option to risk filter |
| S3.10 | Hybrid filtering (backend + client-side) | Move text search to backend |
| S4.4 | No login rate limiting | Add rate limiter middleware |
| S4.5 | 6-char password minimum | Increase to 8+ chars |
| S4.6 | Medical images publicly accessible | Add auth-gated image serving endpoint |
| S4.7 | Wildcard CORS | Restrict to specific methods and headers |
| S5.1 | N+1 queries in `_enrich_screening()` | Batch patient lookups or use `$lookup` aggregation |
| S5.3 | Pagination exists but unused | Add pagination UI in frontend |
| S5.4 | Dashboard stats computed client-side | Use existing `/reports/summary` endpoint |
| S5.6 | 10 sequential count queries | Use `$facet` aggregation pipeline |
| S5.7 | Client-side text search | Add backend text search param |
| S5.10 | All errors silently swallowed | Add error toast/notification system |
| S5.11 | Quick-register no failure feedback | Show inline error on form |
| S5.12 | No global backend exception handler | Add `@app.exception_handler(Exception)` |
| S5.14 | Sequential AI pipeline | Parallelize independent steps |

### LOW (14)
| ID | Summary | Fix |
|----|---------|-----|
| S3.4 | `message` always empty | Use `issues[]` array or generate message from issues |
| S3.5 | `"poor"` status not in frontend type | Add `"poor"` to ScreeningStatus |
| S3.11 | `referralCount` = `atRiskCount` | Differentiate or remove duplicate |
| S4.8 | No security headers | Add CSP, X-Frame-Options, HSTS |
| S4.9 | Sensitive data in logs | Sanitize log output |
| S4.10 | NEXTAUTH_URL=localhost | Use production URL |
| S5.5 | Patient fallback fetches all | Remove fallback or add proper 404 |
| S5.8 | Full file in memory before size check | Stream-read with byte counter |
| S5.9 | No debounce on search | Add 300ms debounce |
| S5.13 | No AI inference timeout | Add configurable timeout |
| S5.15 | `"failed"` shown as `"pending"` | Add explicit failed status to frontend |

---

## Issues by Category

| Category | Count | IDs |
|----------|-------|-----|
| Data Contract / Schema | 8 | S3.1, S3.2, S3.3, S3.4, S3.5, S3.7, S3.8, S3.11 |
| Authentication / Security | 7 | S4.1, S4.2, S4.4, S4.5, S4.6, S4.7, S4.10 |
| Database / Performance | 6 | S5.1, S5.2, S5.3, S5.4, S5.6, S5.7 |
| Error Handling | 5 | S5.10, S5.11, S5.12, S5.13, S5.15 |
| Injection | 1 | S4.3 |
| Headers | 1 | S4.8 |
| Logging | 1 | S4.9 |
| Memory | 1 | S5.8 |
| UX | 1 | S5.9 |
| Redundant Logic | 1 | S3.10 |
| Pipeline | 1 | S5.14 |
| Client | 1 | S5.5 |

---

## Recommended Fix Order

### Before Hackathon Demo (1–2 hours)
| Priority | IDs | Why |
|----------|-----|-----|
| Fix quality score scaling | S3.2 | Shows `0.85 / 100` to user — looks broken |
| Add MongoDB indexes | S5.2 | 5 min fix, massive perf gain |
| Add re.escape to regex | S4.3 | Security — trivial fix |
| Add "MONITOR" to dropdown | S3.8 | User-facing filter gap |
| Add global exception handler | S5.12 | Prevents stack trace leaks |

### Before Production Deploy (4–8 hours)
| Priority | IDs | Why |
|----------|-----|-----|
| Rotate all secrets | S4.1 | Must do before any public exposure |
| Add backend JWT auth | S4.2 | Cannot ship without auth |
| Add error toast system | S5.10 | Users need feedback |
| Fix N+1 queries | S5.1 | Performance degrades with data |
| Fix all Pydantic schemas | S3.1, S3.7 | Type safety |
| Add rate limiting | S4.4 | Prevent brute-force |
| Restrict CORS | S4.7 | Security hardening |
| Add auth to image serving | S4.6 | Medical data access control |
| Add password minimum 8 chars | S4.5 | Healthcare standard |

### Post-Launch Improvements
| Priority | IDs | Why |
|----------|-----|-----|
| Add pagination UI | S5.3 | Scaling |
| Backend text search | S5.7 | Better search UX |
| Use /reports/summary endpoint | S5.4 | Remove redundant client computation |
| Use $facet aggregation | S5.6 | Optimize report queries |
| Add debounce | S5.9 | Minor UX improvement |
| Stream file upload | S5.8 | Edge case memory protection |
| Add inference timeout | S5.13 | Reliability |
| Parallelize AI pipeline | S5.14 | Speed optimization |

---

*End of Phase 1–5 Audit Summary*

---

# DAY 1 — Phase 6: Final Integrated Report & Recommendations

**Date:** 2026-08-26
**Scope:** Executive summary — architecture health, go/no-go, remediation roadmap, effort estimates
**Status:** Complete

---

## 1. Go / No-Go Assessment

### Verdict: **CONDITIONAL GO** — safe to demo, unsafe to deploy to real PHC without fixes

The MVP is functionally complete for a hackathon demo. All core user stories (register patient, upload image, run screening, view results, dashboard) work end-to-end. The architecture is sound for a prototype.

However, **2 issues block production deployment** and **5 more block any real patient data**:

| Blocker | Why it blocks | Fix time |
|---------|---------------|----------|
| **S4.1** — Real secrets on disk | If `.env.local` is committed (even accidentally), all credentials leak | 15 min |
| **S4.2** — Backend has zero auth | Anyone with the URL can upload images, view patient data, run screenings | 4–6 hrs |
| **S4.3** — Regex injection | Crafted search input can crash the backend (ReDoS) | 5 min |
| **S5.2** — No MongoDB indexes | Performance degrades rapidly past ~200 records | 10 min |
| **S3.2** — Quality score broken | Shows `0.85 / 100` — makes the app look broken to judges | 5 min |
| **S5.12** — No global exception handler | Unhandled errors leak stack traces | 10 min |
| **S4.6** — Images publicly accessible | Patient fundus images anyone can view | 2–3 hrs |

**For hackathon demo:** Fix the 3 quick wins (S3.2, S4.3, S5.2, S5.12) — 30 minutes total. The remaining issues are acceptable for a prototype demo with mock data.

**For real PHC deployment:** All 7 blockers above + add JWT auth + rotate secrets + add image access control before any real patient data touches the system.

---

## 2. Architecture Health Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Code Quality** | 7/10 | Clean separation, consistent patterns, typed models. Minor: N+1 queries, no indexes |
| **Security** | 3/10 | Zero backend auth, secrets on disk, injection vector, no access control on images |
| **Data Integrity** | 6/10 | Schemas exist but mismatch between Pydantic and actual responses. No DB-level validation |
| **Performance** | 5/10 | Works fine for <200 records. Will degrade: N+1 queries, no indexes, no pagination |
| **Error Handling** | 3/10 | Backend has exception handlers for 404s only. Frontend swallows all errors silently |
| **UX Polish** | 6/10 | Functional but unpolished: no loading states, no error feedback, no debounce |
| **Scalability** | 4/10 | Hard-coded limits, no pagination, all data loaded in one shot |
| **Test Coverage** | 0/10 | Zero tests in both backend and frontend |

**Overall: 4.25/10** — Acceptable for hackathon MVP. Needs significant hardening for production.

---

## 3. Issue Distribution

```
CRITICAL  ██ 1          (S4.1 — secrets on disk)
HIGH      ████████ 4    (S4.2, S4.3, S5.2, S3.2)
MEDIUM    ████████████████████████████████████ 18
LOW       ████████████████████████████████ 14
```

**By phase:**
- Phase 2 (Feature Mapping): 0 formal issues (documentation phase)
- Phase 3 (Data Flow): 10 issues — mostly schema mismatches
- Phase 4 (Security): 10 issues — 2 critical/high, 5 medium, 3 low
- Phase 5 (Performance): 15 issues — 1 high, 8 medium, 6 low

---

## 4. Detailed Remediation Roadmap

### Sprint 1: Quick Wins (30 min — before demo)

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 1 | S3.2 | Fix `toImageQuality()`: multiply `quality.score * 100` | 2 min |
| 2 | S5.2 | Add indexes in `database.py`: `patient_id`, `created_at`, `prediction.grade`, `risk.level` | 10 min |
| 3 | S4.3 | Wrap regex input in `re.escape()` in `patient_service.py:42` | 2 min |
| 4 | S5.12 | Add `@app.exception_handler(Exception)` in `main.py` | 5 min |
| 5 | S3.8 | Add `"MONITOR"` option to risk filter dropdown | 2 min |

**Total: ~20 min**

---

### Sprint 2: Security Hardening (6–8 hrs — before any real data)

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 1 | S4.1 | Rotate all secrets, add `.env.example` template | 15 min |
| 2 | S4.2 | Add JWT auth middleware to FastAPI routes | 4–6 hrs |
| 3 | S4.6 | Add `/images/{id}` auth-gated endpoint for medical images | 2–3 hrs |
| 4 | S4.7 | Restrict CORS to specific methods (`GET,POST,PUT,DELETE`) and headers | 10 min |
| 5 | S4.5 | Change password minimum to 8 chars in `validations.ts` | 2 min |
| 6 | S4.4 | Add rate limiter (slowapi or in-memory) on `/login/send-otp` | 1 hr |

**Total: ~8–10 hrs**

---

### Sprint 3: Data Contract Fixes (2–3 hrs — same day)

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 1 | S3.1 | Align `ScreeningResponse` Pydantic with actual endpoint return | 30 min |
| 2 | S3.7 | Extend `Risk` schema to include `actionRequired`, `followUpTimeframe` | 15 min |
| 3 | S3.3 | Compute `fundusVisibility` from quality analysis or remove hardcoded `true` | 30 min |
| 4 | S3.5 | Add `"poor"` to `ScreeningStatus` type in frontend | 5 min |
| 5 | S3.4 | Map backend `issues[]` to `message` field or remove `message` from frontend | 15 min |
| 6 | S3.11 | Differentiate `referralCount` (Grade 4/5 only) from `atRiskCount` (all elevated) | 15 min |

**Total: ~2 hrs**

---

### Sprint 4: Performance & UX (4–6 hrs — before production)

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 1 | S5.1 | Fix N+1: batch-load patients in `_enrich_screening()` | 2 hrs |
| 2 | S5.6 | Replace 10 sequential counts with `$facet` aggregation | 1 hr |
| 3 | S5.10 | Add error toast/notification system to frontend | 2 hrs |
| 4 | S5.11 | Add inline error feedback to quick-register form | 15 min |
| 5 | S5.15 | Add `"failed"` status to frontend type and display | 15 min |
| 6 | S5.9 | Add 300ms debounce on search inputs | 30 min |
| 7 | S5.8 | Stream file upload with early size rejection | 1 hr |

**Total: ~7 hrs**

---

### Sprint 5: Production Readiness (post-launch)

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 1 | S5.3 | Add pagination UI to screening list and patient list | 3 hrs |
| 2 | S5.7 | Add backend text search on screening history | 2 hrs |
| 3 | S5.4 | Dashboard: use `/reports/summary` endpoint instead of client-side computation | 1 hr |
| 4 | S5.5 | Remove `getPatientById()` fallback; add proper 404 handling | 30 min |
| 5 | S5.13 | Add configurable timeout to AI inference calls | 1 hr |
| 6 | S5.14 | Parallelize quality check + inference (if independent) | 2 hrs |
| 7 | S4.8 | Add CSP, X-Frame-Options, HSTS headers | 30 min |
| 8 | S4.9 | Sanitize patient names from request logs | 15 min |
| 9 | S4.10 | Use production `NEXTAUTH_URL` in deployment | 5 min |

**Total: ~10 hrs**

---

### Sprint 6: Hardening (post-launch, ongoing)

| # | Item | Effort |
|---|------|--------|
| 1 | Add unit tests for `patient_service`, `screening_service`, `image_service` | 8 hrs |
| 2 | Add integration tests for API endpoints | 6 hrs |
| 3 | Add frontend component tests (React Testing Library) | 6 hrs |
| 4 | Set up CI/CD pipeline | 4 hrs |
| 5 | Add structured logging (JSON format) | 2 hrs |
| 6 | Add health check endpoint (`/health`) | 30 min |

**Total: ~27 hrs**

---

## 5. Effort Summary

| Sprint | Description | Effort | When |
|--------|-------------|--------|------|
| 1 | Quick wins | 20 min | Now |
| 2 | Security hardening | 8–10 hrs | Before real data |
| 3 | Data contracts | 2 hrs | Same day |
| 4 | Performance & UX | 7 hrs | Before production |
| 5 | Production readiness | 10 hrs | Post-launch |
| 6 | Hardening & tests | 27 hrs | Ongoing |
| **Total** | | **~54 hrs** | |

---

## 6. What to Fix NOW (Hackathon Demo Checklist)

- [x] S3.2: `quality.score * 100` in `backendClient.ts:85` ✅ Done
- [x] S5.2: Add MongoDB indexes in `database.py:16-24` ✅ Done
- [x] S4.3: `re.escape()` in `patient_service.py:43` ✅ Done
- [x] S5.12: Global exception handler in `main.py:48-54` — already existed ✅ Confirmed
- [x] S3.8: Add "MONITOR" to risk filter dropdown in `screenings/page.tsx:72` ✅ Done

**Status: COMPLETE** — 2026-08-26

---

## 7. Architecture Decisions (No Changes Needed)

These are **not issues** but documented decisions that are correct for an MVP:

| Decision | Why it's OK for MVP | When to revisit |
|----------|---------------------|-----------------|
| NextAuth self-contained in Next.js | No backend auth needed for MVP | Before production — add JWT to backend |
| Mock inference (`random.choices`) | CNN model is another team member's work | When model is integrated |
| Single MongoDB database (`dr_screening`) | Simple, sufficient for MVP scale | Before production — separate auth DB |
| Static file serving for images | FastAPI `StaticFiles` is fine for prototype | Before production — add auth-gated endpoint |
| Client-side date formatting | `Intl.DateTimeFormat` is adequate | Before production — use date-fns consistently |

---

## 8. Technical Debt Inventory

| Debt | Current State | Target State | Effort |
|------|---------------|--------------|--------|
| No tests | 0% coverage | 80% for services, 50% for components | 27 hrs |
| No CI/CD | Manual deployment | GitHub Actions auto-deploy | 4 hrs |
| No error tracking | `console.error` only | Sentry or similar | 2 hrs |
| No monitoring | None | Health check + basic metrics | 1 hr |
| No rate limiting | None | Rate limiter on all public endpoints | 2 hrs |
| No input sanitization | Trust all input | Sanitize all user inputs | 4 hrs |
| No database migrations | Manual schema changes | Migration tool (Alembic equivalent) | 4 hrs |

---

## 9. Final Recommendation

**For the hackathon:** The system is demo-ready. Fix the 5 quick wins (20 min), and the judges will see a working DR screening pipeline with dashboard, multi-role auth, and an AI analysis flow. The mock inference is fine — explain it's a placeholder for the CNN model.

**For real deployment:** Complete Sprints 1–4 (approximately 17 hours). This covers security, data integrity, performance, and error handling — the minimum bar for handling real patient data in a healthcare setting.

**For production:** Complete all 6 sprints. Add tests, monitoring, and structured logging. This is a 54-hour investment that turns a hackathon prototype into a deployable system.

---

*End of Phase 6 — Final Integrated Report & Recommendations*
