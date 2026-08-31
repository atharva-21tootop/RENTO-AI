# Deploying RetinoCare — MVP Edition (Vercel + Render + MongoDB Atlas)

This is the recommended, low-cost path for an MVP. It uses:

| Tier | Where | Cost | Notes |
|------|-------|------|-------|
| **Frontend (Next.js)** | **Vercel** | Free hobby tier | Builds from `Frontend/`, static + serverless |
| **Backend (FastAPI)** | **Render** | Free web service (spin-down) | Runs the real DR model + Grad-CAM |
| **Database** | **MongoDB Atlas** | Free M0 cluster | 512 MB, plenty for MVP |
| **AI explainer** | Google Gemini | Pay-as-you-go | Optional; falls back to a template if unset |

> Retail/premium hosting (Vercel Pro, Render paid) adds 0–24h uptime, more
> CPU/RAM, and custom SSL. For a demo/PoC the free tier is enough — just
> remember Render free services **spin down after inactivity** (cold start a
> few seconds on next request).

### Architecture note — why cookies "just work"

The frontend proxies `/api/backend/*` and `/storage/*` to the backend via the
Next.js rewrite in `next.config.ts` (`BACKEND_URL`). So the **browser only ever
talks to the Vercel origin** — the backend's `Set-Cookie` rolls back through
the proxy and lands on the Vercel origin. That means a normal
`COOKIE_SECURE=true` + `COOKIE_SAMESITE=lax` setup works with no special CORS.
You do **not** need `SameSite=None`.

The one thing that does NOT ride the proxy is **Google OAuth's redirect**, which
must be pointed at the Vercel origin (see §4).

---

## 0. The one thing that will break your backend: the ML model

The DR model weights **are not in git** (`.gitignore` ignores `*.pth`) and are
**not in the repo**. But the backend **requires** them at runtime:

- Expected file: `backend/app/model/checkpoints/best_model.pth` (46 MB)
- Loaded in `backend/app/features/screenings/inference.py` → `get_model()`
- If missing, every `/analyze` returns 503 `AI_SERVICE_UNAVAILABLE`.

You must get this file onto Render **before** it can run screenings. Pick one:

| Option | How | Best for |
|--------|-----|----------|
| **A. Force-add to git (easiest MVP)** | `git add -f backend/app/model/checkpoints/best_model.pth` then push. It rides your normal deploy. 46 MB in the repo is ugly but harmless for a demo. | Fastest path to a working demo (recommended) |
| **B. Render persistent disk** | Create a 1 GB disk on the Render service, upload the file once to `/opt/render/project/backend/app/model/checkpoints/`, and update CHECKPOINT_PATH if needed. | Clean repo, keeps binary out of git |
| **C. Download at startup** | Add a build step/startup that `curl`s the weights from a private URL (S3/Drive/GitHub release). | If you later move off 46-MB commits |

**`backend/storage/` (uploads + heatmaps) also needs persistence** — Render's
free disk is reset on every deploy. Attach a small persistent disk (Resource →
Disks) and mount it at the `backend/storage` path, otherwise uploaded fundus
images and heatmaps disappear on each redeploy.

---

## 1. Pre-flight checklist

- [ ] App works locally end-to-end (see `README.md`).
- [ ] `backend/.env.example` copied to real values (or set as Render env vars).
- [ ] MongoDB Atlas cluster created with a DB user (not just you allowed in).
- [ ] **Model weights** reachable on Render (§0).
- [ ] **Vercel domain** added to backend `CORS_ORIGINS` (for the rare direct call).
- [ ] Google OAuth redirect URI updated to the **Vercel** domain (§4).

---

## 2. Step-by-step

### Step 1 — MongoDB Atlas (5 min, free)

1. Sign in → Create → **M0 free** cluster → click Create.
2. **Database Access** → Add New Database User:
   - Name: `retinocare`, Password: generate + save.
3. **Network Access** → Add IP Address → `0.0.0.0/0` (allow all; fine for MVP).
4. **Clusters → Connect → Drivers** → copy the connection string, e.g.
   `mongodb+srv://retinocare:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`.
   Replace `<password>` and set `dr_screening` as the DB in `MONGODB_URL`.

### Step 2 — Backend on Render (10 min, free)

1. Push your repo to GitHub first (the model weights per §0 must be included).
2. [render.com](https://render.com) → **New + → Web Service** → connect the repo.
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **Environment** → add every variable from `backend/.env.example`:
   - `MONGODB_URL`, `DATABASE_NAME=dr_screening`
   - `AUTH_SECRET` (must **match** the frontend exactly)
   - `CORS_ORIGINS=https://<your-vercel-app>.vercel.app`
   - `FRONTEND_ORIGIN=https://<your-vercel-app>.vercel.app`
   - `GOOGLE_REDIRECT_URI=https://<your-vercel-app>.vercel.app/api/backend/auth/oauth/google/callback`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `COOKIE_SECURE=true` (leave `COOKIE_SAMESITE=lax`)
   - `GEMINI_API_KEY`, `LLM_MODEL=gemini-3.6-flash` (optional)
4. **Resource → Disks** (if you need persistent uploads/heatmaps): create a
   1 GB disk and mount it at `backend/storage`.
5. Trigger **Deploy**. Wait for the URL, then confirm:
   `https://<your-backend>.onrender.com/health` → `{"status":"ok","db":"connected"}`.

> Free-tier note: Render's free instance sleeps after ~15 min idle. Next request
> cold-starts in a few seconds. Upgrade to a paid instance for always-on.

### Step 3 — Frontend on Vercel (5 min, free)

1. [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
2. **Root Directory:** `Frontend`
3. Framework preset auto-detects **Next.js**; build `npm run build`, output
   `npm run start`. Leave the rest default.
4. **Environment Variables** (Project Settings → Environment Variables) — from
   `Frontend/.env.example`:
   - `AUTH_SECRET` (must **match** the backend exactly)
   - `BACKEND_URL=https://<your-backend>.onrender.com`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (same as backend `GOOGLE_CLIENT_ID`)
   - `NEXTAUTH_URL=https://<your-vercel-app>.vercel.app` (if used)
5. **Deploy.** Vercel gives you `https://<your-vercel-app>.vercel.app`.

### Step 4 — Google OAuth

In the Google Cloud Console, set the **Authorized redirect URI** to exactly:
```
https://<your-vercel-app>.vercel.app/api/backend/auth/oauth/google/callback
```
This must equal `GOOGLE_REDIRECT_URI` in your Render backend env, char-for-char.
Add the Vercel origin to the OAuth client's Authorized JavaScript origins too.

---

## 3. Environment variable reference (final)

### Backend — Render env

```ini
MONGODB_URL=mongodb+srv://retinocare:<password>@<cluster>.mongodb.net/dr_screening
DATABASE_NAME=dr_screening
AUTH_SECRET=<openssl rand -base64 32>
CORS_ORIGINS=https://<your-vercel-app>.vercel.app
FRONTEND_ORIGIN=https://<your-vercel-app>.vercel.app
GOOGLE_REDIRECT_URI=https://<your-vercel-app>.vercel.app/api/backend/auth/oauth/google/callback
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
GEMINI_API_KEY=...
LLM_MODEL=gemini-3.6-flash
```

### Frontend — Vercel env

```ini
AUTH_SECRET=<same value as backend>
BACKEND_URL=https://<your-backend>.onrender.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<same GOOGLE_CLIENT_ID as backend>
NEXTAUTH_URL=https://<your-vercel-app>.vercel.app
```

> `AUTH_SECRET` is the linchpin — it must match identically in both places, or
> sessions won't verify and logins will fail.

---

## 4. Gotchas / hardening

- **Model missing** → screening returns 503. Fix per §0 *before* demoing.
- **Storage resets** → attach a Render disk at `backend/storage` (§0 option B).
- **Cold starts** → Render free sleeps; first request after idle is slow.
- **OAuth redirect mismatch** → login breaks with a redirect error; double-check
  it's the Vercel URL and matches `GOOGLE_REDIRECT_URI`.
- **Never commit secrets** — set them in Render/Vercel env managers, not in
  tracked `.env` files. Real `.env`/`.env.local` are git-ignored already.
- **Gemini optional** — with no `GEMINI_API_KEY` the AI explanation endpoint
  returns a deterministic template (`source: "fallback"`); screening still fully
  works.

---

## 5. Verify the deployed MVP

1. `https://<your-vercel-app>.vercel.app` → marketing site loads.
2. `https://<your-backend>.onrender.com/health` → `db: connected`.
3. Register / **Google login** from the Vercel origin (OAuth redirect works).
4. Run a screening on a sample fundus image → completed result with grade,
   confidence, Grad-CAM heatmap, and risk (proves the model loaded).
5. Open that screening → **AI Clinical Assistant** card shows a plain-language
   explanation + precautions (`source: "llm"`, or `"fallback"` with no key).

---

## 6. Alternatives (when you outgrow the free MVP)

- **Custom domain** — add to Vercel and Render; update `CORS_ORIGINS`,
  `FRONTEND_ORIGIN`, `GOOGLE_REDIRECT_URI`, and the OAuth client accordingly.
- **Docker / VPS** — for single-machine hosting, see `DEPLOY.md` history or add
  a `Dockerfile`; run both tiers behind one origin (simplest cookies).
- **Paid instances** — Vercel Pro / Render paid for always-on, no cold start.
- **Private weights hosting** — move the 46 MB model out of the repo to a
  download-at-startup URL (S3/Cloudflare R2/GitHub Release) once the repo grows.
