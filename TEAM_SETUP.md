# Team Setup — clone & run locally

Takes a teammate from `git clone` to a running app: **frontend + backend + AI model + local MongoDB**.
Also covers how to re-apply the repo's `.gitignore` if your copy already tracks ignored junk.

Stack at a glance:

| Part | Tech | Dir |
| --- | --- | --- |
| Backend | FastAPI, Python 3.10+ (dev: 3.13) | `backend/` |
| Frontend | Next.js 15, React 19, NextAuth v5 | `Frontend/` |
| Database | **MongoDB local** `mongodb://localhost:27017/dr_screening` (no Atlas) | — |
| AI model | PyTorch checkpoint (`*.pth`, **not** in the repo) | `backend/app/model/checkpoints/` |

---

## 1. Prerequisites

1. **Git**
2. **Python 3.10+**
3. **Node.js 18+** (dev: v24)
4. **MongoDB running locally** on `localhost:27017`:
   - Windows: install MongoDB, then `net start MongoDB` (registered service) or run `mongod`
   - The `dr_screening` DB + indexes are created automatically on backend startup

## 2. Clone

```bash
git clone https://github.com/atharva-21tootop/RENTO-AI.git
cd RENTO-AI
```

## 3. Re-apply `.gitignore` (only if your copy is already "dirty")

`.gitignore` only affects files that are **not yet tracked**. If you received this as a zip/import and `git status` shows `node_modules/`, `.env`, `__pycache__/`, `*.pth`, `backend/storage/uploads/` etc. **already tracked**, purge them from the index in one shot:

```bash
git rm -r --cached .
git add -A
git commit -m "chore: apply .gitignore"
```

After this, `git status` will be clean and every ignored path stays out of commits going forward.

The root `.gitignore` covers:

```text
node_modules/  Frontend/.next/  Frontend/.turbo/        *.tsbuildinfo
.pytest_cache/ __pycache__/     *.py[cod]               .venv/  venv/
.env  .env.local  .env.*.local                          (only *.example is kept)
backend/storage/uploads/  backend/storage/heatmaps/
*.pth  *.pt                                             # model weights
.sisyphus/  .opencode/  graphify-out/                   # local tooling
.DS_Store  Thumbs.db
```

> Long form, if you'd rather be explicit:
> `git rm -r --cached node_modules Frontend/node_modules Frontend/.next __pycache__ backend/storage/uploads backend/storage/heatmaps backend/.env Frontend/.env.local` + `git rm --cached "**/*.pth"`

## 4. Model weights (required for `/analyze`)

The trained checkpoint is deliberately **not** committed (`*.pth` is gitignored). Get it from whoever trained it (laptop/Drive) or a future **GitHub Release**, then place it at exactly:

```text
backend/app/model/checkpoints/best_model.pth
```

Verify with `dir backend\app\model\checkpoints` on Windows (`ls -l` on Linux/mac). If it's missing, `/analyze` returns `503 AI_SERVICE_UNAVAILABLE` — everything else still works.

Optional sanity test (needs the checkpoint + `app/model/requirements.txt` installed):

```bash
python -m pytest backend/app/model/test_model.py
```

## 5. Backend setup (Windows PowerShell first, alternatives follow)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install --extra-index-url https://download.pytorch.org/whl/cu124 -r app/model/requirements.txt
Copy-Item .env.example .env
python -m pytest tests -q            # optional — 46 tests, needs MongoDB running
uvicorn app.main:app --reload --port 8000
```

Linux/mac: `source venv/bin/activate`, `cp .env.example .env`, same pip lines, `uvicorn ...`.

- Health check → http://localhost:8000/health returns `{"status":"ok","db":"connected"}`
- Interactive API docs → http://localhost:8000/docs

> **GPU vs CPU:** `app/model/requirements.txt` pins CUDA wheels (`torch==2.6.0+cu124`).
> No GPU? use CPU builds instead (this repo is trained/inference on CPU fine):
>
> ```bash
> pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
> ```
>
> If numpy/opencv downgraded by the model reqs cause conflicts, re-run `pip install -r requirements.txt` afterwards.

## 6. Frontend setup

```powershell
cd Frontend
npm install        # or: npm ci  (package-lock.json is committed)
Copy-Item .env.example .env.local
```

Edit `Frontend/.env.local`:

- **`AUTH_SECRET` must be the exact same value as `backend/.env`** — generate once, paste in both:
  - `npx auth secret` (or `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — leave empty to disable Google login (fine for dev)
- `BACKEND_URL=http://localhost:8000` (already the default)
- `EMAIL_SERVER_*` — same SMTP block as the backend if you want real OTP emails

Start it:

```powershell
npm run dev            # http://localhost:3000
```

Production: `npm run build && npm start`.

## 7. Environment secret — quick reference

| File | Created from | Must contain |
| --- | --- | --- |
| `backend/.env` | `backend/.env.example` | `AUTH_SECRET` (same as frontend), Mongo/CORS defaults, optional `EMAIL_SERVER_*`, `EMAIL_FROM` |
| `Frontend/.env.local` | `Frontend/.env.example` | `AUTH_SECRET` (SAME as backend), optional Google/SMTP creds, `BACKEND_URL` |

Both files are gitignored. **Never commit them** — if `git status` shows either one, don't `git add` it.

## 8. Run & test checklist

1. MongoDB running (service or `mongod`)
2. Backend up on `:8000` — `/health` says ok
3. Frontend up on `:3000`
4. Register an account → the 6-digit OTP arrives by **email** (if you filled SMTP) or is **printed in the backend terminal** (if you left `EMAIL_SERVER_*` empty and aren't running in production)
5. Verify → log in
6. Dashboard: add a patient → create a screening (left/right eye) → upload a fundus image → `/analyze` (needs the checkpoint from section 4)

## 9. Common issues

- **`/health` is not ok** → MongoDB not running, or `MONGODB_URL`/`DATABASE_NAME` wrong in `.env`
- **`503 AI_SERVICE_UNAVAILABLE` on analyze** → missing `best_model.pth` (section 4)
- **Login works but API calls 401** → backend and frontend `AUTH_SECRET` differ; re-point both to the same value and restart both servers
- **OTP not received** → OTP logs to the backend terminal when SMTP is unset; check `backend/.env` `EMAIL_SERVER_*`
- **Registration returns 502 "Failed to send the OTP email"** → SMTP is configured but the Brevo server is rejecting the login. In Brevo go to Settings → SMTP & API → regenerate the **SMTP key**, put it in `backend/.env` `EMAIL_SERVER_PASSWORD`, restart the backend. (During dev you can instead set `SMTP_DISABLED=1` to print the OTP in the terminal.)
- **Google sign-in logs in the wrong user / account never saved** → was a real bug (fixed): the backend now matches on Google's verified `sub` (`google_id`), rejects missing/invalid emails with a 400, and every Google account is persisted once. If old junk users (`email: ""`) exist from before the fix, delete them from `users` in MongoDB.