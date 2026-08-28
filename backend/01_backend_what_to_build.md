# DR Screening System — Backend: What to Build
## (Reorganized Step-by-Step: Build One Feature → Test It → Move to Next)

> **Note:** This file contains the exact same content as the original `01_backend_what_to_build.md`.
> Nothing has been added, removed, or reworded — it has only been re-sequenced into
> numbered steps so you can build one feature, test it, and only then move to the next.

---

## STEP 0 — Context: Your Role (read first, nothing to build yet)

You are responsible for the backend of the AI-Powered Diabetic Retinopathy (DR) Screening System.

Your backend sits between the Next.js frontend and the AI/CNN inference pipeline.

```text
Next.js Frontend
       |
       | HTTP / REST
       v
FastAPI Backend
       |
       +--> MongoDB
       |
       +--> Image Storage
       |
       +--> Image Quality Assessment
       |
       +--> CNN / EfficientNet Inference
       |
       +--> Grad-CAM Generation
```

Your responsibility is NOT to train the CNN. Another team member owns the model.

Your responsibility is to expose the model and system functionality through clean REST APIs.

### MVP Critical Flow (the workflow you're building toward)

The most important workflow is:

```text
Healthcare Worker
      |
      v
Register Patient
      |
      v
Upload Fundus Image
      |
      v
Create Screening
      |
      v
Image Quality Assessment
      |
      +-------------------+
      |                   |
      v                   v
   POOR QUALITY        GOOD QUALITY
      |                   |
      v                   v
 Return issues        Run AI Model
 "Recapture"              |
                           v
                     DR Grade 0–4
                           |
                           v
                        Grad-CAM
                           |
                           v
                   Risk Recommendation
                           |
                           v
                    Return JSON Result
```

This flow must work before building secondary features.

---

## STEP 1 — Environment & Stack Setup

**Build:**

Recommended Backend Stack

- Python 3.11+
- FastAPI
- Uvicorn
- Pydantic
- PyMongo or Motor
- MongoDB
- OpenCV
- NumPy
- PyTorch
- Pillow
- python-multipart
- python-dotenv

Optional:
- aiofiles
- pytest
- httpx

For a hackathon MVP, local image storage is acceptable. Do not waste time setting up cloud object storage unless deployment requires it.

**Test before moving on:**
- Confirm the virtual environment activates and all packages above import without error.

---

## STEP 2 — Project Folder Structure

**Build:**

Recommended Backend Project Structure

```text
backend/
|
├── app/
│   ├── main.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   └── database.py
│   │
│   ├── api/
│   │   ├── patients.py
│   │   ├── screenings.py
│   │   ├── phc.py
│   │   └── reports.py
│   │
│   ├── models/
│   │   ├── patient.py
│   │   ├── screening.py
│   │   └── phc.py
│   │
│   ├── schemas/
│   │   ├── patient.py
│   │   ├── screening.py
│   │   ├── quality.py
│   │   └── result.py
│   │
│   ├── services/
│   │   ├── patient_service.py
│   │   ├── screening_service.py
│   │   ├── image_service.py
│   │   ├── quality_service.py
│   │   ├── inference_service.py
│   │   ├── gradcam_service.py
│   │   └── risk_service.py
│   │
│   └── utils/
│       └── file_utils.py
│
├── storage/
│   ├── uploads/
│   └── heatmaps/
│
├── tests/
├── requirements.txt
├── .env.example
└── README.md
```

Keep route handlers thin. Business logic belongs in services.

**Test before moving on:**
- Confirm every folder/file above exists and the app still imports with empty stub files.

---

## STEP 3 — Health Check Endpoint

**Build:**

### GET `/health`

Response:

```json
{
  "status": "ok"
}
```

**Test before moving on:**
- `GET /health` (from the Tasks Checklist, P0 list, and the Testing sequence below).

---

## STEP 4 — CORS

**Build:**

The Next.js frontend and FastAPI backend will likely run on different ports during development.

Configure CORS explicitly.

Example allowed origin during local development:

```text
http://localhost:3000
```

Do not use unrestricted `*` origins with credentials in a production design.

**Test before moving on:**
- Confirm CORS is configured (P0 checklist item).

---

## STEP 5 — Database Connection (MongoDB)

**Build:**

- Connect MongoDB (P0 checklist item).

**Test before moving on:**
- Confirm the app starts and successfully connects to MongoDB.

---

## STEP 6 — Core Data Models: Patient & Screening

**Build:**

### Patient

```json
{
  "patient_id": "P-0001",
  "name": "Example Patient",
  "age": 56,
  "gender": "male",
  "diabetes_duration_years": 10,
  "contact_number": "optional",
  "created_at": "ISO datetime"
}
```

### Screening

```json
{
  "screening_id": "SCR-0001",
  "patient_id": "P-0001",
  "eye": "left",
  "status": "completed",
  "image_path": "storage/uploads/...",
  "created_at": "ISO datetime"
}
```

Suggested status values:

```text
created
image_uploaded
quality_checking
quality_failed
ai_processing
completed
failed
```

Avoid random boolean fields such as `isAnalyzing`, `isDone`, etc. The status should represent the workflow state.

- Create patient schemas/models (P0 checklist item).
- Create screening model (P0 checklist item).

**Test before moving on:**
- Confirm patient and screening schemas validate correctly with sample data.

---

## STEP 7 — Patient APIs

**Build:**

### POST `/api/patients`

Create a patient.

### GET `/api/patients`

Optional query parameters:

```text
search
page
limit
```

### GET `/api/patients/{patient_id}`

Get one patient.

### GET `/api/patients/{patient_id}/screenings`

Get screening history for a patient.

- Implement patient CRUD needed for MVP (P0 checklist item).

**Test before moving on:**
- Create patient (Testing sequence item).
- Get/list patient (Testing sequence item).

---

## STEP 8 — PHC Profile (basic)

**Build:**

For MVP:

### GET `/api/phc/profile`

### PUT `/api/phc/profile`

If multi-PHC support is not needed for the demo, do not overengineer tenant management.

**Test before moving on:**
- Confirm both endpoints respond and persist changes.

---

## STEP 9 — Screening Creation

**Build:**

### POST `/api/screenings`

Create a screening record.

Request:

```json
{
  "patient_id": "P-0001",
  "eye": "left"
}
```

Response:

```json
{
  "screening_id": "SCR-0001",
  "status": "created"
}
```

- Implement screening creation (P0 checklist item).

**Test before moving on:**
- Create screening (Testing sequence item).

---

## STEP 10 — Fundus Image Upload

**Build:**

### POST `/api/screenings/{screening_id}/image`

Upload the fundus image using `multipart/form-data`.

Validate:

- JPEG/JPG/PNG only
- Maximum file size
- Image can actually be opened
- Invalid/corrupt images rejected

Response:

```json
{
  "screening_id": "SCR-0001",
  "image_uploaded": true,
  "image_url": "/storage/uploads/..."
}
```

- Implement fundus image upload (P0 checklist item).
- Validate image type, size, and readability (P0 checklist item).
- Save uploaded images (P0 checklist item).

### Static File Serving

For the MVP, expose uploaded images and heatmaps through FastAPI static file mounting.

Example concept:

```text
/storage/uploads/...
/storage/heatmaps/...
```

Ensure generated URLs are usable by the frontend.

- Serve uploaded images and heatmaps (P0 checklist item).

**Test before moving on:**
- Upload image (Testing sequence item).
- Confirm original image URL works (Testing sequence item).

---

## STEP 11 — Image Quality Assessment

**Build:**

For the MVP, implement a rule-based quality gate using OpenCV.

Minimum checks:

### Resolution

Reject images below a reasonable minimum dimension.

### Blur

Use Laplacian variance.

Concept:

```text
Image
  |
Grayscale
  |
Laplacian
  |
Variance
  |
Threshold
```

Low variance generally indicates blur.

### Brightness

Calculate mean pixel intensity.

Detect:

- too dark
- acceptable
- too bright

### Contrast

Use intensity spread / standard deviation or another simple reproducible metric.

### Fundus Visibility

Only include this if it is actually implemented.

Do not return a fake `fundus_visibility: true` merely because the frontend expects it.

### Example quality response

```json
{
  "status": "good",
  "score": 0.89,
  "checks": {
    "resolution": true,
    "brightness": true,
    "contrast": true,
    "blur": true
  },
  "issues": []
}
```

Poor image:

```json
{
  "status": "poor",
  "score": 0.32,
  "checks": {
    "resolution": true,
    "brightness": false,
    "contrast": true,
    "blur": false
  },
  "issues": [
    "Image appears blurry",
    "Poor illumination"
  ],
  "action": "recapture"
}
```

Important: thresholds used in the MVP must not be described as clinically validated unless they actually are.

### POST `/api/screenings/{screening_id}/quality`

Run image quality assessment.

- Implement blur check (P0 checklist item).
- Implement brightness check (P0 checklist item).
- Implement contrast check (P0 checklist item).
- Implement resolution check (P0 checklist item).
- Return good/poor image quality result (P0 checklist item).

**Test before moving on:**
- Run quality check (Testing sequence item).

---

## STEP 12 — AI Model Integration Contract (Inference Adapter)

**Build:**

The AI member should expose or provide a Python-callable interface similar to:

```python
result = predict(image_path)
```

Expected logical output:

```python
{
    "grade": 2,
    "confidence": 0.91
}
```

Grade mapping:

```text
0 = No DR
1 = Mild DR
2 = Moderate DR
3 = Severe DR
4 = Proliferative DR
```

Do not tightly couple the entire backend to one notebook or training script.

Create an adapter/service:

```text
services/inference_service.py
```

The rest of the backend should call:

```python
run_inference(image_path)
```

If the model implementation changes later, only this integration layer should need major changes.

- Integrate AI model through an inference service (P0 checklist item).

**Test before moving on:**
- Confirm `run_inference()` returns the expected shape using a mock adapter.

---

## STEP 13 — Grad-CAM Integration

**Build:**

The AI member should ideally expose:

```python
generate_gradcam(image_path)
```

Your backend should:

1. Generate the heatmap
2. Save it under `storage/heatmaps/`
3. Return a URL/path

Example:

```json
{
  "heatmap_url": "/storage/heatmaps/SCR-0001.png"
}
```

The frontend should display this as an AI explanation.

Do not label Grad-CAM regions as specific lesions unless a lesion detection/segmentation system actually provides that information.

- Integrate Grad-CAM output (P0 checklist item).

**Test before moving on:**
- Confirm a heatmap file is generated and saved under `storage/heatmaps/`.

---

## STEP 14 — Risk and Referral Mapping

**Build:**

Keep this logic in one place:

```text
services/risk_service.py
```

Suggested MVP mapping:

| Grade | Result | Risk | Recommendation |
|---|---|---|---|
| 0 | No DR | LOW | Routine follow-up |
| 1 | Mild DR | MONITOR | Follow-up recommended |
| 2 | Moderate DR | HIGH | Ophthalmologist referral recommended |
| 3 | Severe DR | HIGH | Priority referral recommended |
| 4 | Proliferative DR | URGENT | Urgent specialist evaluation recommended |

Poor image:

```text
Risk: RECAPTURE
Recommendation: Retake retinal image
```

These are prototype screening workflow rules, not autonomous diagnoses.

- Implement risk/recommendation mapping (P0 checklist item).

**Test before moving on:**
- Confirm each grade (0–4) and the poor-image case map to the correct risk/recommendation.

---

## STEP 15 — Complete Analysis Pipeline

**Build:**

### POST `/api/screenings/{screening_id}/analyze`

Run the complete analysis pipeline:

1. Verify image exists
2. Run quality assessment
3. Stop if poor
4. Preprocess image
5. Call CNN inference
6. Generate Grad-CAM
7. Map DR grade to risk/recommendation
8. Save result
9. Return structured JSON

This is the endpoint the frontend can use for the simplest MVP flow.

- Implement final screening result endpoint (P0 checklist item).

**Test before moving on:**
- Test poor-quality path (Testing sequence item).
- Test acceptable-quality path (Testing sequence item).
- Run analyze (Testing sequence item).

---

## STEP 16 — Final API Contract & Result Retrieval

**Build:**

### GET `/api/screenings/{screening_id}`

Return the latest screening result.

The most important response should look like this:

```json
{
  "screening_id": "SCR-0001",
  "patient_id": "P-0001",
  "eye": "left",
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

Freeze this contract with the frontend member early.

**Test before moving on:**
- Get result (Testing sequence item).
- Confirm heatmap URL works (Testing sequence item).

---

## STEP 17 — Screening History & Filters

**Build:**

### GET `/api/screenings`

Return screening history.

Useful filters:

```text
patient_id
risk
grade
date_from
date_to
```

- Screening history filters (P1 checklist item).
- Pagination (P1 checklist item).

**Test before moving on:**
- Confirm filters return the expected subset of screenings.

---

## STEP 18 — Error Handling (apply across all endpoints above)

**Build:**

Use consistent HTTP errors.

Examples:

```text
400 — invalid request
404 — patient/screening not found
413 — uploaded file too large
415 — unsupported image type
422 — validation error
500 — unexpected server error
503 — AI model unavailable
```

Example error response:

```json
{
  "detail": {
    "code": "QUALITY_CHECK_FAILED",
    "message": "Unable to process the uploaded image"
  }
}
```

Keep errors predictable so the frontend can display them cleanly.

**Test before moving on:**
- Reject invalid image (Testing sequence item).
- Manually trigger each error code above and confirm the response shape is consistent.

---

## STEP 19 — Report Data (P1, only after P0 is solid)

**Build:**

- Report data endpoint (P1 checklist item).
- Better logging (P1 checklist item).
- Basic automated tests (P1 checklist item).

**Test before moving on:**
- Confirm report data reflects a completed screening correctly.

---

## STEP 20 — Full End-to-End Test (Definition of Done for MVP)

**Test the complete chain, in order:**

1. `GET /health`
2. Create patient
3. List patient
4. Create screening
5. Upload valid image
6. Reject invalid image
7. Run quality assessment
8. Test poor-quality path
9. Test acceptable-quality path
10. Run full analysis
11. Verify result JSON
12. Verify image URL
13. Verify heatmap URL

If this full chain works reliably, the P0 MVP backend is complete.

---

## Reference: Full Tasks Checklist (unchanged, kept for tracking)

### P0 — Must Build

- [ ] Create FastAPI project
- [ ] Configure environment variables
- [ ] Add `/health`
- [ ] Configure CORS
- [ ] Connect MongoDB
- [ ] Create patient schemas/models
- [ ] Implement patient CRUD needed for MVP
- [ ] Create screening model
- [ ] Implement screening creation
- [ ] Implement fundus image upload
- [ ] Validate image type, size, and readability
- [ ] Save uploaded images
- [ ] Implement blur check
- [ ] Implement brightness check
- [ ] Implement contrast check
- [ ] Implement resolution check
- [ ] Return good/poor image quality result
- [ ] Integrate AI model through an inference service
- [ ] Integrate Grad-CAM output
- [ ] Implement risk/recommendation mapping
- [ ] Implement final screening result endpoint
- [ ] Serve uploaded images and heatmaps
- [ ] Test complete frontend-to-backend API contract

### P1 — Build If Time Allows

- [ ] PHC profile API
- [ ] Screening history filters
- [ ] Pagination
- [ ] Report data endpoint
- [ ] Better logging
- [ ] Basic automated tests

### P2 — Skip Unless MVP Is Complete

- [ ] JWT/auth duplication in FastAPI
- [ ] Complex role-based access control
- [ ] Cloud image storage
- [ ] Background task queues
- [ ] Celery/Redis
- [ ] Docker orchestration
- [ ] Advanced analytics
- [ ] Full PDF generation
- [ ] Complex multi-PHC tenancy

The goal is a working demo, not an enterprise hospital platform.
