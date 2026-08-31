# NetraCare — PHC Diabetic Retinopathy Screening

AI-assisted diabetic retinopathy (DR) screening for healthcare workers at Primary
Health Centres: a done-right-now RETINO screenshot — patient cards, fundus image
capture, quality checks, AI grading, Grad-CAM heatmap, and risk triage in one local
app (Next.js + FastAPI + MongoDB).

---

## 1. Problem & Approach

Diabetic retinopathy is a leading cause of preventable blindness: it is
asymptomatic until advanced, and expert ophthalmologists needed to read fundus
photos are scarce in PHCs. This system lets a PHC worker capture a fundus image,
get an instant AI-grade with an explainability heatmap, and see a referral
recommendation (`low → urgent`) so the right patients reach a specialist.

> **Disclaimer:** This is a prototype screening *aid*, not an autonomous diagnostic
> tool and not a medical device. Grades, quality checks and risk levels are outputs
> of a locally trained model plus heuristics and are **not clinically validated**.
> All results require review by a qualified medical professional.

## 2. Architecture

```
                          ┌──────────────────────────────────────────────┐
                          │  Local MongoDB  (dr_screening)               │
                          │  users, phcs, otps, patients, screenings,    │
                          │  counters                                    │
                          └──────────▲───────────────────────────────────┘
                                     │ single writer
                          ┌──────────┴───────────────┐
                          │  FastAPI backend :8000   │
                          │  /api/auth/* /api/patients│
                          │  /api/screenings /api/phc │
                          │  /api/reports /storage/*  │
                          └──────────▲────────────────┘
                                     │ Next rewrites:
                                     │ /api/backend/* → /api/*
                                     │ /storage/*      → /storage/*
                          ┌──────────┴───────────────┐
                          │  Next.js frontend :3000   │
                          │  (NextAuth = session shim,│
                          │   Google OAuth handshake) │
                          └──────────────────────────┘
```

There is exactly **one** database (`dr_screening` on `localhost:27017`), and the
backend is its only writer. The frontend has no MongoDB driver, no Mongoose, and no
`MONGODB_URI`. The Atlas → local-Mongo migration is **complete in code**: no Atlas
connection string exists anywhere in the repo.

## 3. Tech Stack

**Backend** (`backend/requirements.txt`): FastAPI, uvicorn[standard], pydantic,
PyMongo, python-multipart, opencv-python-headless, numpy, pillow, python-dotenv,
aiofiles, httpx, pytest, passlib[bcrypt] (bcrypt==4.0.1), python-jose[cryptography].
PyTorch (`torch 2.13.0+cpu` in this dev env) is required only for `/analyze` and is
declared in `app/model/requirements.txt`.

**Frontend** (`Frontend/package.json`): next ^15.2, react ^19, next-auth ^5 (beta),
nodemailer, lucide-react, zod, typescript, tailwindcss.

## 4. Folder Structure

```
D:\SIH\2026\
├── backend\
│   ├── app\
│   │   ├── core\       # config, database, security (bcrypt+JWT), auth (get_current_user), signed_url, rate_limiter, logging
│   │   ├── features\   # feature-first: routes + service + schemas per feature
│   │   │   ├── auth\        # register/login/verify-otp/resend/oauth-google/forgot/reset/me + otp.py + email.py
│   │   │   ├── patients\    # CRUD + list + per-patient screenings
│   │   │   ├── screenings\  # image upload, quality, analyze (inference/gradcam/quality/risk/image)
│   │   │   ├── phc\         # PHC profile GET/PUT
│   │   │   └── reports\     # aggregate summary
│   │   ├── model\      # DR model package: src\ (model, train, evaluate, inference, gradcam), checkpoints\, results\
│   │   └── utils\
│   ├── scripts\migrate_atlas_to_local.py  # one-time Atlas → local migration (+ --backup)
│   └── tests\test_api.py                  # 46 tests
└── Frontend\
    ├── app\            # /api/auth/*, /api/register, /api/phc proxies; /login /register /verify-email /
    │                   #   /forgot-password /reset-password /dashboard/**
    ├── auth.ts / auth.config.ts / middleware.ts
    ├── lib\api\        # backendClient, phc, patients, screening, reports, initAuth
    ├── lib\backend-auth.ts, backend-proxy.ts, mockData.ts, validations.ts, utils.ts
    └── components\
```

## 5. Getting Started

### Prerequisites

- Python 3.10+ (this repo runs on 3.13)
- Node.js 18.18+ (Next.js 15 requirement; 20+ recommended)
- MongoDB Community Server running locally (`mongodb://localhost:27017`)
- (Optional) Brevo/SMTP creds for real OTP email · Google OAuth creds for Google sign-in

### Install

```bash
# 1. backend
cd backend
python -m venv .venv && .venv\Scripts\activate   # or: pip install -r requirements.txt globally
pip install -r requirements.txt

# 2. frontend
cd ../Frontend
npm install
```

### Environment variables

Frontend — copy `Frontend/.env.example` → `Frontend/.env.local`:

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | session + token signing; **must match** the backend's |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (frontend-side handshake) |
| `EMAIL_SERVER_HOST` / `_PORT` / `_USER` / `_PASSWORD`, `EMAIL_FROM` | SMTP for OTP email |
| `BACKEND_URL` | `http://localhost:8000` |

Backend — `backend/.env` (see `backend/.env.example`):

| Variable | Purpose |
| --- | --- |
| `MONGODB_URL` / `DATABASE_NAME` | local DB, e.g. `mongodb://localhost:27017` / `dr_screening` |
| `AUTH_SECRET` | **must equal** the frontend's — Verifies/signs bearer tokens |
| `CORS_ORIGINS` / `MAX_UPLOAD_SIZE_MB` | CORS / upload cap (default 10 MB) |
| `EMAIL_SERVER_*`, `EMAIL_FROM` | OTP email — omitted in dev → OTP logged to backend terminal |

### Start MongoDB

```bash
# standard local install:
mongod --dbpath /path/to/data
# on Windows with the MongoDB service: Start-Service MongoDB
```

### Run

```bash
# backend → http://localhost:8000
cd D:\SIH\2026\backend
python -m uvicorn app.main:app --port 8000 --reload

# frontend → http://localhost:3000 (second terminal)
cd D:\SIH\2026\Frontend
npm run dev
```

### Confirm it works

- `http://localhost:8000/health` → `{"status":"ok","db":"connected"}` (backend + Mongo up).
- `http://localhost:3000` → register a test user (PHC code + OTP email, or OTP
  printed in the backend terminal when SMTP is unconfigured), then log in.

### Tests & checks

```bash
cd backend && python -m pytest tests -q   # 46 tests (needs MongoDB running)
cd Frontend && npm run build && npm run lint
```

## 6. API Overview

All backend routes are mounted under `/api/*`; the frontend proxies them through
`/api/backend/*` (Next rewrite) and `/api/auth/*`, `/api/register`, `/api/phc`
custom route handlers. Full request/response schemas: FastAPI auto-generates docs at
`http://localhost:8000/docs` (Swagger/OpenAPI).

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | create user + PHC (if new), send OTP | public |
| POST | `/api/auth/verify-otp` | verify email / reset OTP | public |
| POST | `/api/auth/resend-otp` | resend code (60 s cooldown) | public |
| POST | `/api/auth/login` | credentials login → `access_token` + user | public |
| POST | `/api/auth/oauth/google` | upsert Google user → `access_token` | public |
| POST | `/api/auth/forgot-password` | send reset OTP (anti-enumeration) | public |
| POST | `/api/auth/reset-password` | verify reset OTP + set new password | public |
| GET | `/api/auth/me` | current user payload | Bearer |
| GET | `/api/phc/profile` | PHC profile of current user | Bearer |
| PUT | `/api/phc/profile` | update PHC profile | Bearer |
| POST | `/api/patients` | register patient | Bearer |
| GET | `/api/patients?search&page&limit` | list patients (paged) | none * |
| GET | `/api/patients/{id}` | patient detail | none * |
| GET | `/api/patients/{id}/screenings` | patient's screenings | none * |
| POST | `/api/screenings` | create screening (left/right eye) | Bearer |
| POST | `/api/screenings/{id}/image` | upload fundus image (jpg/png ≤10 MB) | Bearer |
| POST | `/api/screenings/{id}/quality` | heuristic image-quality check | Bearer |
| POST | `/api/screenings/{id}/analyze` | quality check → AI grade + Grad-CAM → risk | Bearer |
| GET | `/api/screenings/{id}` | screening detail | none * |
| GET | `/api/screenings?patient_id&grade&risk&page&limit` | list screenings (paged) | none * |
| GET | `/api/reports/summary` | aggregate counts/grades | none * |
| GET | `/storage/uploads/{file}` | serving uploaded images | signed URL **or** Bearer |
| GET | `/storage/heatmaps/{file}` | serving Grad-CAM heatmaps | signed URL **or** Bearer |
| GET | `/health` | liveness + Mongo ping | public |

\* Read routes are **not** auth-gated yet — see Known Limitations.

## 7. Authentication

- **Single authority:** the backend. Passwords are bcrypt-hashed (`passlib[bcrypt]`);
  OTPs are `secrets`-generated 6-digit codes, bcrypt-hashed, stored in `otps`
  (10-min expiry, 5 attempts, 60 s resend cooldown), emailed via
  `features/auth/email.py`
  (Brevo/SMTP, dev fallback logs to terminal).
- **Who issues the JWT:** the backend (`app/core/security.py`), HS256 signed with
  `AUTH_SECRET`, **24 h** lifetime. Claims: `id`→`sub`, `email`, `name`, `role`
  (`phc_staff`), `phcId`, `provider`, `exp`.
- **How the frontend attaches it:** `lib/api/initAuth.ts` → `GET /api/auth/token`
  → resolver in `lib/backend-auth.ts`: prefers `session.accessToken` (the backend
  token NextAuth stored at login); for legacy sessions it decrypts the NextAuth
  cookie (Auth.js v5 stores it as an encrypted JWE) and **re-signs it as a plain
  HS256 JWT** the backend accepts. `lib/api/backendClient.ts` sends
  `Authorization: Bearer <token>`. Route handlers use the same resolver via
  `lib/backend-proxy.ts`.
- **Google OAuth:** wired. NextAuth performs the handshake
  (`GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET`), then the `jwt` callback calls
  `POST /api/auth/oauth/google`, which upserts the user (`provider: "google"`) and
  returns a backend token. Google users skip OTP (auto-verified).

Atlas→local migration is **done**: all auth tokens/sessions run against the local
`dr_screening` DB. No two databases anywhere.

## 8. Database

| Collection | Owned/written by |
| --- | --- |
| `users` | `features/auth/service.py` (register, google upsert, reset) — one per account |
| `phcs` | `features/auth/service.py` on register; `features/phc/service.py` on profile update (profile lives on the PHC doc — there is **no** separate `phc_profiles` collection) |
| `otps` | `features/auth/otp.py` (bcrypt-hashed, deleted on verify/expiry/reset) |
| `patients` | `features/patients/service.py` (unique `patient_id` `P-0001` via `counters`) |
| `screenings` | `features/screenings/service.py` (unique `screening_id` `SCR-0001` via `counters`) |
| `counters` | sequential-id sequence docs |

Connection is local-only: `MONGODB_URL=mongodb://localhost:27017`,
`DATABASE_NAME=dr_screening`. Indexes on patients/screenings are created on startup
(`core/database.py`).

## 9. AI Model Integration

DR grading + Grad-CAM come from the **real, locally trained model** under
`backend/app/model/` — not a mock:

- `screenings/inference.py` loads `app/model/checkpoints/best_model.pth` into a
  PyTorch model (`app/model/src/model.py`) and runs `predict_dr` → grade
  (0–4 `GRADE_LABELS`), confidence, per-class probabilities. The checkpoint is
  bundled and `torch 2.13.0+cpu` is installed in the dev env.
- `screenings/gradcam.py` produces a Grad-CAM overlay saved to
  `app/model/.../storage/heatmaps` and returns a signed URL for `<img>` tags.
- Quality gating (`screenings/quality.py`) is a **heuristic** (resolution, blur,
  brightness, contrast) — poor images fail with a `RECAPTURE` risk instead of
  reaching the model.
- Risk mapping (`screenings/risk.py`) turns grades into `low | monitor | high | urgent`
  labels with a follow-up timeframe and referral action.

> The model is trained and its artifacts live in `app/model/results/`
> (metrics, confusion matrix, classification report), but it is **not clinically
> validated** — treat grades and heatmaps as a triage aid only. `torch` is not in the
> top-level `requirements.txt`; install `app/model/requirements.txt` for `/analyze`.

## 10. Known Limitations / Not Yet Implemented

- **Ungated read routes:** `GET /api/patients*`, `GET /api/screenings*`, and
  `GET /api/reports/summary` accept requests without a token. Writes, `/analyze`,
  `/quality`, `/image`, and `/api/phc/*` are gated, and `/storage/*` requires a
  signed URL or Bearer — but reads are open (patches planned).
- **Owner scoping:** storage/auth is not owner-scoped — any authenticated role can
  read any screening files. (Flagged `ponytail:` in `main.py`.)
- **Bulk patient screenings** (`/api/patients/{id}/screenings`) are not paginated.
- **Reports** are a single aggregate `/summary`; no per-patient/PDF reports.
- **No `phc_profiles` collection** exists despite earlier planning docs — the PHC
  profile lives on the `phcs` document.
- **Frontend mock fallbacks:** `lib/mockData.ts` (`INITIAL_PHC_PROFILE`) is used when
  a `/api/phc` call fails; the model/PHC UI can show placeholder data offline.
- **Rate limiting** is a single global bucket (no per-user), and the OTP cooldown is
  per-email.
- **No pagination beyond patients/screenings lists**; no search on screenings list.
- **Model:** single checkpoint, small local dataset, CPU inference in dev; no data
  augmentation/clinical evaluation pipeline exposed via the API.

## 11. Team / Ownership

Work split across the planned three tracks (list authors as contributors do in the
repo): **AI/Model** ([Name]) — model training/eval, Grad-CAM, quality pipeline ·
**Backend** ([Name]) — FastAPI, auth/OTP, storage, screening APIs · **Frontend**
([Name]) — Next.js UI, NextAuth/proxying, screening & dashboard flows.
*(The repo has no git authorship history tracked here; fill in names as appropriate.)*

## 12. License

No `LICENSE` file is present in the repo root, so no license is asserted.