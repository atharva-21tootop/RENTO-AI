# DR Screening Backend

FastAPI backend for the RetinoCare PHC Diabetic Retinopathy screening app. Runs on
a single local MongoDB (`dr_screening`) and owns all auth/OTP/email logic. Full
project docs (architecture, env vars, auth flow, migration): see the **root `README.md`**.

## Quick Start

```bash
python -m venv venv
venv\Scripts\activate            # Windows  (Linux/Mac: source venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env           # then fill in AUTH_SECRET (+ optional SMTP)

# MongoDB must be running locally, then:
uvicorn app.main:app --reload --port 8000
```

- API docs (OpenAPI/Swagger): http://localhost:8000/docs
- Health check: `GET /health` → `{"status":"ok","db":"connected"}`
- Tests (needs MongoDB running): `python -m pytest tests -q`

> `/api/screenings/{id}/analyze` needs PyTorch and the DR model checkpoint
> (`app/model/checkpoints/best_model.pth`). Install `app/model/requirements.txt`
> for the model stack.

## Project Structure (feature-first)

```
app/
├── main.py                    # app assembly, CORS, rate-limiter, storage routes
├── core/                      # cross-cutting: config, database, security, auth (get_current_user), signed_url, rate_limiter, logging
├── features/
│   ├── auth/                  # register/login/verify-otp/resend/oauth-google/forgot/reset/me + otp.py (OTP logic) + email.py (SMTP)
│   ├── patients/              # routes/ service/ schemas/
│   ├── screenings/            # routes/ service/ schemas/ + image.py quality.py inference.py gradcam.py risk.py
│   ├── phc/                   # routes/ service/ schemas/
│   └── reports/               # routes/ service/
├── model/                     # DR model package: src/ (model, train, evaluate, inference, gradcam), checkpoints/, results/
└── utils/                     # shared helpers (mongo_utils)
```

## Endpoints

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/register`, `/verify-otp`, `/resend-otp`, `/login`, `/oauth/google`, `/forgot-password`, `/reset-password` | public |
| GET | `/api/auth/me` | Bearer |
| GET/PUT | `/api/phc/profile` | Bearer |
| POST | `/api/patients` | Bearer |
| GET | `/api/patients`, `/api/patients/{id}`, `/api/patients/{id}/screenings` | none * |
| POST | `/api/screenings`, `/api/screenings/{id}/image`, `/quality`, `/analyze` | Bearer |
| GET | `/api/screenings`, `/api/screenings/{id}` | none * |
| GET | `/api/reports/summary` | none * |
| GET | `/storage/uploads/{file}`, `/storage/heatmaps/{file}` | signed URL or Bearer |
| GET | `/health` | public |

\* Read routes are not auth-gated yet — see Known Limitations in the root README.

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `MONGODB_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `DATABASE_NAME` | `dr_screening` | Database name |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `MAX_UPLOAD_SIZE_MB` | `10` | Maximum upload file size |
| `AUTH_SECRET` | — | **must match** the frontend's; signs/verifies bearer tokens |
| `EMAIL_SERVER_HOST/_PORT/_USER/_PASSWORD`, `EMAIL_FROM` | — | OTP email (dev fallback logs OTP to the terminal) |