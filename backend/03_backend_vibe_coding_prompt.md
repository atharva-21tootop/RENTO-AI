# Prompt for Vibe Coding Tools — Build the Backend
## (Reorganized Step-by-Step: Build One Feature → Test It → Move to Next)

> **Note:** This file contains the exact same content as the original
> `03_backend_vibe_coding_prompt.md`. Nothing has been added, removed, or
> reworded — it has only been re-sequenced into numbered steps. When pasting
> this into Antigravity, Cursor, Windsurf, Lovable backend agent, or another
> coding agent, instruct it to complete and test one step before starting the next.

Copy the following prompt into Antigravity, Cursor, Windsurf, Lovable backend agent, or another coding agent.

---

You are working inside an existing project for a Smart India Hackathon MVP.

Build ONLY the Python FastAPI backend for an AI-powered Diabetic Retinopathy (DR) screening system.

IMPORTANT CONTEXT:

- The frontend already exists or is being built separately in Next.js.
- Authentication is handled by the existing frontend project.
- Another team member is responsible for the CNN/AI model and Grad-CAM implementation.
- Your responsibility is to build the REST API, database layer, image upload pipeline, image quality assessment, AI integration adapter, result pipeline, and API contracts.
- Do NOT rebuild the Next.js frontend.
- Do NOT implement duplicate authentication unless explicitly required later.
- Do NOT train a CNN.
- The backend must be easy to integrate with a future or external PyTorch model implementation.

**Build ONE step below at a time. After each step, run the "Test before moving on" checks for that step. Only proceed to the next step once those checks pass.**

==================================================
PROJECT GOAL (context — read before Step 1)
==================================================

The system is used by healthcare workers at Primary Health Centres to screen diabetic patients for Diabetic Retinopathy.

Critical user flow:

Patient registration
→ Create screening
→ Select left/right eye
→ Upload fundus image
→ Validate image
→ Image quality assessment
→ If poor: return recapture recommendation
→ If acceptable: run AI model
→ Receive DR grade 0–4 and confidence
→ Generate Grad-CAM heatmap
→ Map result to risk and referral recommendation
→ Save result
→ Return structured JSON to frontend

The critical workflow must work before secondary features.

==================================================
TECH STACK (context — read before Step 1)
==================================================

Use:

- Python 3.11+
- FastAPI
- Uvicorn
- Pydantic
- MongoDB
- PyMongo or Motor, choosing the simpler option that fits the project
- OpenCV
- NumPy
- Pillow
- python-multipart
- python-dotenv
- PyTorch integration through a service adapter

Do not introduce unnecessary infrastructure such as Celery, Redis, Kafka, Kubernetes, or microservices.

For the MVP, local image and heatmap storage is acceptable.

==================================================
STEP 1: INSPECT BEFORE CODING
==================================================

Before modifying files:

1. Inspect the repository structure.
2. Identify whether a backend already exists.
3. Identify existing environment/configuration files.
4. Identify database configuration.
5. Do not overwrite working frontend code.
6. Reuse existing backend patterns if they exist.
7. Create the backend as a separate clean module if no backend exists.

Do not delete unrelated files.

**Test before moving on:** Confirm you can state clearly whether a backend already exists, what config/env files are present, and what database configuration (if any) is already in place.

==================================================
STEP 2: CREATE THE BACKEND STRUCTURE
==================================================

Use a clean structure similar to:

backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   └── database.py
│   ├── api/
│   │   ├── patients.py
│   │   ├── screenings.py
│   │   ├── phc.py
│   │   └── reports.py
│   ├── schemas/
│   │   ├── patient.py
│   │   ├── screening.py
│   │   ├── quality.py
│   │   └── result.py
│   ├── services/
│   │   ├── image_service.py
│   │   ├── quality_service.py
│   │   ├── inference_service.py
│   │   ├── gradcam_service.py
│   │   ├── risk_service.py
│   │   └── screening_service.py
│   └── utils/
├── storage/
│   ├── uploads/
│   └── heatmaps/
├── tests/
├── requirements.txt
├── .env.example
└── README.md

Adapt to the existing repository where necessary.

Keep route handlers thin and move business logic into services.

**Test before moving on:** Confirm the app boots with this structure in place (empty stubs are fine at this point).

==================================================
STEP 3: HEALTH ENDPOINT
==================================================

GET /health

Return:

{
  "status": "ok"
}

**Test before moving on:** `GET /health` (Testing checklist, item 1).

==================================================
STEP 4: CORS AND CONFIGURATION
==================================================

Configure CORS for the Next.js frontend.

Use environment variables.

Example .env.example:

MONGODB_URL=
DATABASE_NAME=
CORS_ORIGINS=http://localhost:3000
MAX_UPLOAD_SIZE_MB=10

Do not hardcode secrets.

**Test before moving on:** Confirm the server reads `.env` values and CORS allows the configured origin.

==================================================
STEP 5: DATABASE
==================================================

Use MongoDB.

Create logical collections for:

- patients
- screenings
- phc_profiles

Use generated application IDs such as:

P-0001
SCR-0001

or UUID-based IDs if easier.

Be consistent.

Use ISO timestamps.

Do not expose raw MongoDB ObjectIds as the main frontend contract unless there is a clear reason.

**Test before moving on:** Confirm the app connects to MongoDB and can write/read a test document in each collection.

==================================================
STEP 6: PATIENTS ENDPOINTS
==================================================

POST /api/patients
GET /api/patients
GET /api/patients/{patient_id}
GET /api/patients/{patient_id}/screenings

**Test before moving on:**
- Create patient (Testing checklist, item 2).
- Get/list patient (Testing checklist, item 3).

==================================================
STEP 7: SCREENINGS — CREATE
==================================================

POST /api/screenings

Request:

{
  "patient_id": "P-0001",
  "eye": "left"
}

**Test before moving on:** Create screening (Testing checklist, item 4).

==================================================
STEP 8: IMAGE UPLOAD
==================================================

POST /api/screenings/{screening_id}/image

Accept multipart/form-data image upload.

The upload endpoint must:

1. Require a file.
2. Accept JPG, JPEG, and PNG.
3. Reject unsupported files.
4. Enforce a reasonable maximum size.
5. Verify the file can actually be decoded as an image.
6. Generate a safe unique filename.
7. Save the image under local storage.
8. Update the screening record.
9. Return a frontend-accessible image URL.

Do not trust client filenames.

Serve stored uploads and generated heatmaps as static files.

**Test before moving on:**
- Upload valid image (Testing checklist, item 5).
- Reject invalid image (Testing checklist, item 6).
- Verify image URL (Testing checklist, item 12).

==================================================
STEP 9: IMAGE QUALITY ASSESSMENT
==================================================

POST /api/screenings/{screening_id}/quality

Run image quality assessment.

Implement a simple rule-based MVP using OpenCV.

Minimum checks:

- Resolution
- Blur using Laplacian variance
- Brightness
- Contrast

Create separate functions:

check_resolution()
check_blur()
check_brightness()
check_contrast()

Combine them through:

assess_image_quality()

Return a structure like:

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

For poor quality:

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

Do not claim that arbitrary thresholds are clinically validated.

Make thresholds configurable through settings/constants.

**Test before moving on:**
- Run quality assessment (Testing checklist, item 7).
- Test poor-quality path (Testing checklist, item 8).
- Test acceptable-quality path (Testing checklist, item 9).

==================================================
STEP 10: AI MODEL INTEGRATION ADAPTER
==================================================

The CNN model is implemented by another team member.

Create a clean adapter:

services/inference_service.py

Expose an internal function:

run_inference(image_path)

Expected logical result:

{
  "grade": 2,
  "confidence": 0.91
}

Grade mapping:

0 = No DR
1 = Mild DR
2 = Moderate DR
3 = Severe DR
4 = Proliferative DR

If the real model is not available yet, implement a clearly isolated mock adapter so the complete backend can be tested.

Do NOT spread mock inference logic throughout route handlers.

Only inference_service.py should need to change when the real model is connected.

**Test before moving on:** Confirm `run_inference(image_path)` returns the expected shape via the mock adapter, independent of any route handler.

==================================================
STEP 11: GRAD-CAM INTEGRATION
==================================================

Create:

services/gradcam_service.py

Expose:

generate_gradcam(image_path)

The backend should save the generated heatmap under:

storage/heatmaps/

and return:

{
  "heatmap_url": "/storage/heatmaps/example.png"
}

If the real Grad-CAM implementation is not available yet, use an isolated development placeholder implementation that can later be replaced.

Do not claim that Grad-CAM highlights specific medical lesions unless the AI system actually performs lesion detection or segmentation.

**Test before moving on:** Confirm `generate_gradcam(image_path)` saves a heatmap file and returns a valid `heatmap_url`.

==================================================
STEP 12: RISK MAPPING
==================================================

Implement all risk mapping in:

services/risk_service.py

Use:

Grade 0:
LOW RISK
Routine follow-up

Grade 1:
MONITOR
Follow-up recommended

Grade 2:
HIGH RISK
Ophthalmologist referral recommended

Grade 3:
HIGH RISK
Priority referral recommended

Grade 4:
URGENT
Urgent specialist evaluation recommended

Poor image:
RECAPTURE
Retake retinal image

These are prototype screening workflow recommendations, not autonomous diagnoses.

**Test before moving on:** Confirm each grade (0–4) and the poor-image case map to the correct risk level and recommendation text.

==================================================
STEP 13: COMPLETE ANALYSIS PIPELINE
==================================================

POST /api/screenings/{screening_id}/analyze

Implement:

1. Retrieve screening.
2. Verify image exists.
3. Set status to quality_checking.
4. Run image quality assessment.
5. Save quality result.
6. If quality is poor:
   - Set status to quality_failed.
   - Return quality result and recapture action.
   - Do not run the AI model.
7. If quality is acceptable:
   - Set status to ai_processing.
   - Run inference_service.run_inference().
   - Generate Grad-CAM.
   - Map grade to risk.
   - Save all results.
   - Set status to completed.
   - Return the final result.

Suggested status state machine:

created
→ image_uploaded
→ quality_checking
→ quality_failed

OR

created
→ image_uploaded
→ quality_checking
→ ai_processing
→ completed

Technical failures should use:

failed

**Test before moving on:** Run full analysis (Testing checklist, item 10) and confirm the status transitions match the state machine above for both the poor-quality and acceptable-quality paths.

==================================================
STEP 14: FINAL RESPONSE CONTRACT
==================================================

GET /api/screenings/{screening_id}

Return saved result.

Use this stable response shape:

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

Use Pydantic response schemas where practical.

Do not randomly rename these fields after implementation.

**Test before moving on:**
- Verify result JSON (Testing checklist, item 11).
- Verify heatmap URL (Testing checklist, item 13).

==================================================
STEP 15: SCREENING HISTORY
==================================================

GET /api/screenings

Return screening history with optional filters where practical.

**Test before moving on:** Confirm the list endpoint returns screenings and honors any filters implemented.

==================================================
STEP 16: PHC PROFILE
==================================================

GET /api/phc/profile
PUT /api/phc/profile

Reports can remain minimal and should not delay the critical screening flow.

**Test before moving on:** Confirm both endpoints respond correctly and PUT persists changes.

==================================================
STEP 17: ERROR HANDLING (apply across all endpoints above)
==================================================

Use consistent HTTP responses.

Examples:

400 invalid request
404 resource not found
413 file too large
415 unsupported image type
422 validation error
500 internal error
503 AI model unavailable

Return predictable error structures.

Do not expose Python stack traces to clients.

**Test before moving on:** Manually trigger each error code above across the endpoints already built and confirm the response structure stays consistent.

==================================================
STEP 18: FULL TESTING PASS
==================================================

Create enough tests or manual verification support to verify:

1. GET /health
2. Create patient
3. Get/list patient
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

The project must run successfully.

Run:

- backend tests if implemented
- import/startup checks
- lint/format checks if configured

Do not stop after generating skeleton files.

==================================================
REFERENCE: MVP PRIORITY (for sequencing decisions)
==================================================

P0 — MUST WORK (Steps 3–14 above):

Patient
→ Screening
→ Image Upload
→ Image Quality Gate
→ AI Inference Adapter
→ Grad-CAM Adapter
→ Risk Mapping
→ Final JSON Result

P1 (Steps 15–16 above):

Patient history
PHC profile
Screening history filters
Report data

P2 — ONLY AFTER MVP WORKS:

Complex authentication
Role management
Cloud storage
Celery/Redis
Advanced analytics
Full PDF generation
Complex multi-PHC architecture

Do not spend time on P1/P2 while the P0 workflow is incomplete.

==================================================
FINAL REQUIREMENT
==================================================

The backend is successful only if a frontend can:

1. Create/select a patient.
2. Create a screening for left or right eye.
3. Upload a fundus image.
4. Receive a poor-image recapture response OR a completed result.
5. Receive:
   - image quality
   - DR grade
   - confidence
   - heatmap URL
   - risk
   - recommendation
6. Render those results without needing knowledge of OpenCV or PyTorch internals.

Implement the system incrementally and keep the code clean, minimal, and easy to integrate with the real CNN model.
