# Backend Development Guide — Goal, Starting Point, and Execution Plan
## (Reorganized Step-by-Step: Build One Feature → Test It → Move to Next)

> **Note:** This file contains the exact same content as the original
> `02_backend_goal_and_starting_guide.md`. Nothing has been added, removed, or
> reworded — it has only been re-sequenced into numbered steps so you can build
> one feature, test it, and only then move to the next.

---

## STEP 0 — Context: What Is the Goal? (read first, nothing to build yet)

Build a FastAPI backend for an AI-powered Diabetic Retinopathy screening application used by healthcare workers at Primary Health Centres.

The backend must make this user journey work:

```text
Login handled by existing frontend auth
        |
        v
Healthcare worker registers/selects patient
        |
        v
Backend creates patient record
        |
        v
Healthcare worker uploads fundus image
        |
        v
Backend stores and validates image
        |
        v
Backend checks image quality
        |
   +----+-----+
   |          |
Poor       Acceptable
   |          |
   v          v
Recapture   AI inference
               |
               v
           DR grade
               |
               v
           Grad-CAM
               |
               v
       Risk + recommendation
               |
               v
        JSON sent to frontend
```

The frontend should not know how OpenCV, PyTorch, EfficientNet, or Grad-CAM work internally.

It sends requests. The backend performs the pipeline and returns structured data.

### First Principle: Do Not Start With Everything

Do not begin by building:

- reports
- PHC management
- dashboards
- advanced authentication
- complex database abstractions
- Docker
- Celery
- cloud deployment

Start with the one critical path:

```text
POST patient
    |
POST screening
    |
POST image
    |
POST quality
    |
POST analyze
    |
GET result
```

If this works, the project has a functioning core.

### Recommended Build Order (the shape of the steps below)

```text
Phase A — Server
FastAPI → health check → CORS → config

Phase B — Database
MongoDB connection → patient collection → screening collection

Phase C — Patients
Create patient → list patients → get patient

Phase D — Images
Create screening → upload image → save image → serve image

Phase E — Quality
Resolution → blur → brightness → contrast → combined quality response

Phase F — AI
Inference adapter → DR grade → confidence → Grad-CAM

Phase G — Final Pipeline
/analyze → quality gate → AI → Grad-CAM → risk mapping → save result → return JSON

Phase H — Integration
Next.js frontend → FastAPI → real image → result UI
```

---

## STEP 1 — Environment Setup (Phase A)

**Build:**

Create a Python virtual environment.

Install:

```text
fastapi
uvicorn
pydantic
pymongo or motor
python-multipart
opencv-python
numpy
pillow
python-dotenv
```

PyTorch should be installed according to the model team's environment requirements.

**Test before moving on:**
- Confirm all packages install and import cleanly in the virtual environment.

---

## STEP 2 — Minimal App + Health Check (Phase A)

**Build:**

First target:

```text
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

Run the server and verify Swagger docs.

**Test before moving on:**
- `GET /health` (Minimum Test Sequence, item 1).

---

## STEP 3 — CORS (Phase A)

**Build:**

Allow the Next.js frontend development origin.

Typical local origin:

```text
http://localhost:3000
```

**Test before moving on:**
- Confirm a request from `http://localhost:3000` is not blocked by CORS.

---

## STEP 4 — Folder Structure (Phase A)

**Build:**

Create:

```text
api/
schemas/
services/
core/
storage/
```

Do not overengineer.

**Test before moving on:**
- Confirm the app still runs with the new empty folders/modules in place.

---

## STEP 5 — Database Connection (Phase B)

**Build:**

```text
MongoDB connection
→ patient collection
→ screening collection
```

**Test before moving on:**
- Confirm the app connects to MongoDB on startup without error.

---

## STEP 6 — Build Patient APIs (Phase C)

**Build:**

Implement:

```text
POST /api/patients
GET /api/patients
GET /api/patients/{patient_id}
```

Test them independently before connecting the frontend.

At this point, your API should be testable through Swagger.

**Test before moving on:**
- Create patient (Minimum Test Sequence, item 2).
- List patient (Minimum Test Sequence, item 3).

---

## STEP 7 — Build the Image Upload Flow (Phase D)

**Build:**

Create:

```text
POST /api/screenings
```

Then:

```text
POST /api/screenings/{screening_id}/image
```

The upload endpoint must:

1. Check file exists
2. Validate extension/content type
3. Check maximum size
4. Verify image can be decoded
5. Generate a safe unique filename
6. Save the image
7. Update the screening record
8. Return image URL

Do not trust the filename sent by the client.

**Test before moving on:**
- Create screening (Minimum Test Sequence, item 4).
- Upload image (Minimum Test Sequence, item 5).
- Confirm original image URL works (Minimum Test Sequence, item 9).

---

## STEP 8 — Build Image Quality Assessment (Phase E)

**Build:**

Start simple.

Implement separate functions:

```python
check_resolution(image)
check_blur(image)
check_brightness(image)
check_contrast(image)
```

Then combine them:

```python
assess_image_quality(image_path)
```

Expected logical result:

```python
{
    "status": "good",
    "score": 0.89,
    "checks": {...},
    "issues": []
}
```

Test with:

- a normal fundus image
- an intentionally blurred image
- a dark image
- an overexposed image

Do not spend hours tuning thresholds. Make the behavior explainable and consistent for the demo.

**Test before moving on:**
- Run quality check (Minimum Test Sequence, item 6).
- Confirm the four test images above (normal, blurred, dark, overexposed) each produce a sensible result.

---

## STEP 9 — Define the AI Integration Boundary (Phase F)

**Build:**

Meet with the AI/model member and agree on exactly this kind of interface:

```python
prediction = run_inference(image_path)
```

Expected:

```python
{
    "grade": 0,
    "confidence": 0.95
}
```

And:

```python
heatmap_path = generate_gradcam(image_path)
```

Your backend should not depend on:

- Jupyter notebook cells
- training code
- dataset paths
- frontend code

Wrap model interaction inside:

```text
services/inference_service.py
services/gradcam_service.py
```

If the AI member has not finished, temporarily return deterministic mock results through the same interface.

That allows backend development to continue without blocking.

**Test before moving on:**
- Confirm `run_inference()` and `generate_gradcam()` both return the expected shape via the mock adapter.

---

## STEP 10 — Build the Complete Analysis Endpoint (Phase G)

**Build:**

Create:

```text
POST /api/screenings/{screening_id}/analyze
```

Pseudo-flow:

```python
get screening
    |
verify image exists
    |
quality = assess_image_quality(image)
    |
if quality is poor:
    save quality result
    return poor result
    |
prediction = run_inference(image)
    |
heatmap = generate_gradcam(image)
    |
risk = map_grade_to_risk(prediction.grade)
    |
save everything
    |
return final result
```

This is the core endpoint for the frontend demo.

**Test before moving on:**
- Run analyze (Minimum Test Sequence, item 7).

---

## STEP 11 — Build the API Contract Before Integration (Phase G)

**Build:**

Share a single JSON response with the frontend member.

Use one stable response shape.

Example:

```json
{
  "screening_id": "SCR-0001",
  "status": "completed",
  "image_url": "/storage/uploads/SCR-0001.jpg",
  "image_quality": {
    "status": "good",
    "score": 0.89,
    "checks": {
      "resolution": true,
      "brightness": true,
      "contrast": true,
      "blur": true
    },
    "issues": []
  },
  "prediction": {
    "grade": 2,
    "label": "Moderate DR",
    "confidence": 0.91
  },
  "explanation": {
    "heatmap_url": "/storage/heatmaps/SCR-0001.png"
  },
  "risk": {
    "level": "high",
    "recommendation": "Ophthalmologist referral recommended"
  }
}
```

Do not change field names randomly after the frontend starts integration.

If you must change the API, tell the frontend member immediately.

**Test before moving on:**
- Get result (Minimum Test Sequence, item 8).
- Confirm heatmap URL works (Minimum Test Sequence, item 10).

---

## STEP 12 — Integration With Frontend (Phase H)

**Build:**

```text
Next.js frontend
→ FastAPI
→ real image
→ result UI
```

**Test before moving on:**
- Perform one complete test from the Next.js application (Testing Strategy, final step).

---

## STEP 13 — Full Testing Strategy (Definition of Done)

**Build/Verify:**

Before connecting to the frontend, test every endpoint using Swagger or Postman.

Minimum test sequence:

1. `GET /health`
2. Create patient
3. List patient
4. Create screening
5. Upload image
6. Run quality check
7. Run analyze
8. Get result
9. Confirm original image URL works
10. Confirm heatmap URL works

Then perform one complete test from the Next.js application.

### Definition of Done

The backend is done for the MVP when this works reliably:

```text
Patient created
      |
Fundus image uploaded
      |
Image quality checked
      |
Poor image -> recapture response

OR

Good image
      |
CNN returns DR grade
      |
Grad-CAM generated
      |
Risk mapped
      |
Result saved
      |
Frontend receives JSON
      |
Original image + heatmap render correctly
```

Everything beyond this is secondary.

---

## STEP 14 — Final Reality Check (read after Step 13 passes)

Do not confuse "many endpoints" with progress.

A backend with:

```text
20 unfinished APIs
```

is worse than:

```text
6 APIs that complete the full screening workflow
```

Your primary success metric is:

> Can a healthcare worker upload a fundus image and receive a complete screening result through the frontend?

If yes, the MVP works.

If no, dashboards, reports, authentication extras, and advanced database features do not matter.
