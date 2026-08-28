# RetinoCare — PHC Diabetic Retinopathy Screening

Frontend: **Next.js 15 (App Router) + TypeScript + Tailwind + Auth.js v5 (NextAuth)**
Backend: **FastAPI + PyMongo** in `../backend`

There is exactly **one** database: the backend's local MongoDB database `dr_screening`,
and the backend is its only writer. The frontend never connects to MongoDB directly —
no Mongoose, no MongoDB driver, no `MONGODB_URI` in the frontend.

---

## Architecture

```
Browser ── Next.js (NextAuth session = JWT only)
              │  ╭─ /api/register, /api/auth/*  → POST  FastAPI /api/auth/*   (register, OTP, login, reset)
              │  ╭─ /api/phc, /api/backend/*    → FastAPI /api/*             (patients, screenings, reports, phc)
              └─ /storage/*                     → FastAPI /storage/*         (signed URL or Bearer token)
                                                   │
                                              local Mongo "dr_screening"
                                              users, phcs, otps, patients,
                                              screenings, phc_profiles, counters
```

- **Auth**: NextAuth stays in the frontend for the Google OAuth *handshake* only.
  Every credential check (register, verify-otp, login, google upsert, forgot/reset
  password) is a call to FastAPI `POST /api/auth/*`. The backend issues the access
  token (`HS256`, `AUTH_SECRET`); NextAuth stores it on `session.accessToken` and
  `app/api/auth/token/route.ts` hands it to the API client (`lib/api/backendClient.ts`
  → `initAuth`).
- **OTP / email**: generated, hashed (bcrypt), stored and verified in the backend
  (`app/features/auth/otp.py`). If SMTP is unconfigured and not production, the
  code is logged to the backend terminal.
- **Storage**: screening images/heatmaps are served from `/storage/*` only to requests
  with a valid Bearer token **or** a short-lived HMAC-signed URL (so `<img>` tags work).
  Bearer-less, signature-less requests are rejected with 401.

## Environment variables

Frontend `.env.local`:

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | shared by NextAuth **and** the backend (must match) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `EMAIL_SERVER_HOST` / `EMAIL_SERVER_PORT` / `EMAIL_SERVER_USER` / `EMAIL_SERVER_PASSWORD` / `EMAIL_FROM` | SMTP (Brevo) — or dev OTP logging |
| `BACKEND_URL` | e.g. `http://localhost:8000` |

Backend `.env` (in `../backend`):

| Variable | Purpose |
| --- | --- |
| `MONGODB_URL` | e.g. `mongodb://localhost:27017` |
| `DATABASE_NAME` | `dr_screening` |
| `AUTH_SECRET` | must equal the frontend's `AUTH_SECRET` |
| `CORS_ORIGINS` | e.g. `http://localhost:3000` |

No `MONGODB_URI` / Atlas anywhere. The Atlas connection string is only ever supplied
ad-hoc to `backend/scripts/migrate_atlas_to_local.py` for the one-time migration.

## Running locally

```bash
# backend (http://localhost:8000)
cd ../backend && python -m uvicorn app.main:app --reload

# frontend (http://localhost:3000)
npm run dev
```

Backend tests (needs a running local MongoDB):

```bash
cd ../backend && python -m pytest tests -q
```

## How authentication works

1. **Register** → `POST /api/register` proxies to FastAPI `POST /api/auth/register`:
   creates/finds the PHC (`phcs`), creates the user (`is_verified: false`), sends an
   OTP email.
2. **Verify email** → `POST /api/auth/verify-otp` marks `is_verified: true`.
3. **Login** → NextAuth `Credentials.authorize()` calls FastAPI
   `POST /api/auth/login` (bcrypt check + verified check) and keeps the returned
   backend token on the session.
4. **Google** → NextAuth performs the OAuth handshake, then the `jwt` callback calls
   FastAPI `POST /api/auth/oauth/google` to upsert the user and get a backend token.
5. **Forgot/reset password** → OTP with purpose `reset_password`.

`bcryptjs` (formerly Node) and `passlib[bcrypt]` (Python) hashes are compatible,
so migrated Atlas user hashes keep working without forcing password resets.

## One-time migration from Atlas (already performed)

If moving an existing Atlas deployment: run

```bash
cd ../backend
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/... python scripts/migrate_atlas_to_local.py --dry-run
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/... python scripts/migrate_atlas_to_local.py
```

It copies `users`, `phcs`, `otps` into `dr_screening`, keeps `_id`s so `phc_id`
references stay intact, drops Mongoose-only fields (`__v`, `createdAt`→`created_at`),
logs read/write counts, and never touches Atlas.

To decommission Atlas, first write a safety snapshot (raw JSON, ObjectIds intact),
then remove the connection string from every deployment and delete/pause the cluster:

```bash
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/... python scripts/migrate_atlas_to_local.py --backup ../atlas_backup_$(date +%F).json
```