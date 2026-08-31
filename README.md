# NetraCare — PHC Diabetic Retinopathy Screening

AI-assisted diabetic retinopathy (DR) screening for healthcare workers at Primary
Health Centres: patient management, fundus image capture, quality checks, AI grading,
Grad-CAM heatmap explainability, and risk triage in a full-stack application (Next.js 15 + FastAPI + MongoDB).

---

## 1. Problem & Approach

Diabetic retinopathy is a leading cause of preventable blindness: it is
asymptomatic until advanced, and expert ophthalmologists needed to read fundus
photos are scarce in rural PHCs. NetraCare lets a PHC worker capture a fundus image,
get an instant AI grade with an explainability heatmap, and receive an automated referral
recommendation (`low → urgent`) so high-risk patients are flagged for timely specialist care.

> **Disclaimer:** This is a prototype screening *aid*, not an autonomous diagnostic
> tool and not a medical device. Grades, quality checks and risk levels are outputs
> of a trained model plus heuristics and are **not clinically validated**.
> All results require review by a qualified medical professional.

## 2. Architecture

```
                          ┌──────────────────────────────────────────────┐
                          │  MongoDB Database (dr_screening)             │
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
                          │  (Auth Middleware, JWT,  │
                          │   Google OAuth Flow)     │
                          └──────────────────────────┘
```

The backend is the sole authority and writer to MongoDB. The frontend communicates with the backend via HTTP proxy rewrites (`/api/backend/*`), using Bearer JWT authentication for all protected endpoints and data queries.

## 3. Tech Stack

**Backend** (`backend/requirements.txt`): FastAPI, uvicorn[standard], pydantic,
PyMongo, python-multipart, opencv-python-headless, numpy, pillow, python-dotenv,
aiofiles, httpx, pytest, certifi, passlib[bcrypt], python-jose[cryptography].
PyTorch is used for `/analyze` model inference and Grad-CAM generation (`app/model/requirements.txt`).

**Frontend** (`Frontend/package.json`): Next.js 15 App Router, React 19, TypeScript,
Tailwind CSS, Lucide Icons, Jose (JWT verification edge-safe), Zod.

## 4. Folder Structure

```
.
├── backend/
│   ├── app/
│   │   ├── core/       # config, database, security (bcrypt+JWT), auth (get_current_user), signed_url, rate_limiter, logging
│   │   ├── features/   # feature-first architecture
│   │   │   ├── auth/        # register, login, verify-otp, resend, oauth-google, complete-profile, forgot/reset, me
│   │   │   ├── patients/    # patient management + PHC-scoped queries
│   │   │   ├── screenings/  # image upload, quality, AI analyze (inference/gradcam/quality/risk), PHC-scoped listings
│   │   │   ├── phc/         # PHC profile GET/PUT
│   │   │   └── reports/     # PHC-scoped aggregate statistics
│   │   ├── model/      # DR model package: src/ (model, train, evaluate, inference, gradcam), checkpoints/
│   │   └── utils/
│   └── tests/          # Pytest suite
└── Frontend/
    ├── app/            # Next.js 15 App Router (public landing, login, register, onboarding, dashboard)
    ├── components/     # UI components (public layout, dashboard widgets, screening flow)
    ├── lib/            # API clients, session helpers, token validation
    └── middleware.ts   # Edge route guard & profile onboarding redirection
```

## 5. Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18.18+ (20+ recommended)
- MongoDB Server running locally or MongoDB Atlas URI (`mongodb://localhost:27017` or Atlas connection string)
- (Optional) Brevo/SMTP credentials for OTP emails · Google OAuth client ID/secret for Google Sign-In

### Install

```bash
# 1. Backend
cd backend
python -m venv .venv && source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 2. Frontend
cd ../Frontend
npm install
```

### Environment Variables

Frontend — `Frontend/.env.local`:

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Session + JWT token signing; **must match** backend `AUTH_SECRET` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `BACKEND_URL` | `http://localhost:8000` |

Backend — `backend/.env`:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URL` / `DATABASE_NAME` | MongoDB URI / database name (`dr_screening`) |
| `AUTH_SECRET` | Must equal frontend `AUTH_SECRET` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | Google OAuth verification & callback |
| `CORS_ORIGINS` / `FRONTEND_ORIGIN` | CORS settings (`http://localhost:3000`) |
| `EMAIL_SERVER_*`, `EMAIL_FROM` | SMTP for OTP verification emails |

### Run Application

```bash
# Backend (Terminal 1) → http://localhost:8000
cd backend
python -m uvicorn app.main:app --port 8000 --reload

# Frontend (Terminal 2) → http://localhost:3000
cd Frontend
npm run dev
```

## 6. API Overview

All backend routes are mounted under `/api/*`. The frontend proxies requests via `/api/backend/*`. Full interactive API docs are available at `http://localhost:8000/docs` (Swagger UI).

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Create user + PHC, send verification OTP | Public |
| POST | `/api/auth/verify-otp` | Verify OTP code | Public |
| POST | `/api/auth/resend-otp` | Resend verification code | Public |
| POST | `/api/auth/login` | Email/password login → returns `access_token` | Public |
| GET | `/api/auth/oauth/google/login` | Initiate Google OAuth redirect | Public |
| GET | `/api/auth/oauth/google/callback` | Google OAuth callback & user onboarding check | Public |
| POST | `/api/auth/complete-profile` | Complete profile for Google OAuth users (associates PHC) | Bearer |
| POST | `/api/auth/forgot-password` | Send password reset OTP | Public |
| POST | `/api/auth/reset-password` | Reset password using OTP | Public |
| GET | `/api/auth/me` | Fetch active user session profile | Bearer |
| GET | `/api/phc/profile` | Get PHC profile details | Bearer |
| PUT | `/api/phc/profile` | Update PHC profile details | Bearer |
| POST | `/api/patients` | Register new patient (stamped with `phc_id`) | Bearer |
| GET | `/api/patients` | List patients (scoped to current user's PHC) | Bearer |
| GET | `/api/patients/{id}` | Get patient details | Bearer |
| GET | `/api/patients/{id}/screenings` | List patient screenings | Bearer |
| POST | `/api/screenings` | Create screening (stamped with `phc_id`) | Bearer |
| POST | `/api/screenings/{id}/image` | Upload fundus image | Bearer |
| POST | `/api/screenings/{id}/quality` | Run image quality assessment | Bearer |
| POST | `/api/screenings/{id}/analyze` | Quality check → AI DR grading + Grad-CAM heatmap | Bearer |
| GET | `/api/screenings/{id}` | Get screening details | Bearer |
| GET | `/api/screenings` | List screenings (scoped to current user's PHC) | Bearer |
| GET | `/api/reports/summary` | Aggregate PHC statistics (scoped to current user's PHC) | Bearer |
| GET | `/health` | Liveness & database connection health check | Public |

## 7. Authentication & Multi-Tenant PHC Data Isolation

- **Authentication Authority:** FastAPI backend issues HS256 JWT bearer tokens signed with `AUTH_SECRET`.
- **Google OAuth Onboarding:** First-time Google sign-ins are flagged with `needs_profile: true`. Users are automatically redirected to `/onboarding` to enter their PHC details before gaining access to the dashboard.
- **PHC Data Isolation:** All patient registrations, screening tests, and summary statistics are stamped with and filtered by `phc_id`. Accounts belonging to the same PHC share their data, while different PHCs remain strictly isolated.

## 8. AI DR Grading & Explainability

- **DR Grading Model:** Trained PyTorch model (`app/model/checkpoints/best_model.pth`) evaluates fundus images into DR Grades 0–4 (No DR, Mild, Moderate, Severe, Proliferative).
- **Grad-CAM Heatmaps:** Generates visual heatmaps highlighting retinal lesion regions contributing to the AI model's risk score.
- **Quality Gating:** Heuristic quality check (resolution, blur, brightness, contrast) flags low-quality images and recommends a recapture before analysis.

## 9. Team & Credits

Engineered for **Smart India Hackathon 2026** by **Team Debug Thugs**:
- **AI / ML Vision Lead:** DR classification models, Grad-CAM heatmap generation, and quality check pipeline.
- **Backend Systems Lead:** FastAPI architecture, MongoDB integration, multi-tenant PHC isolation, and JWT/OAuth authentication.
- **Frontend Architect:** Next.js 15 App Router, clinical workflow UX, responsive design, and state management.
- **Full-Stack Integrator:** System architecture, end-to-end API integration, and security.

## 10. License

Developed for Smart India Hackathon (SIH) 2026. All rights reserved.