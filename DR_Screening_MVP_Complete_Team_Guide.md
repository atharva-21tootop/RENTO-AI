# AI-Powered Diabetic Retinopathy (DR) Screening System
## Smart India Hackathon MVP – Complete Team Overview

> **Project Type:** AI-assisted healthcare screening system  
> **Target Users:** Primary Health Centre (PHC) healthcare workers  
> **Core Goal:** Enable early screening for Diabetic Retinopathy using fundus images, image-quality assessment, AI classification, explainable AI, and referral guidance.

---

# 1. Project Overview

Diabetic Retinopathy (DR) is a complication of diabetes that can damage the blood vessels of the retina and may lead to vision loss. Early screening is important because timely identification and referral can help reduce avoidable vision loss.

In many rural and resource-constrained areas, regular manual screening by ophthalmologists is difficult to scale. This project proposes an **AI-assisted DR screening workflow** that can be used at Primary Health Centres (PHCs).

A healthcare worker uploads a retinal **fundus image**. The system first evaluates whether the image is suitable for screening. If the image passes the quality gate, it is sent to an AI model that predicts the DR severity level. The system also provides a Grad-CAM visualization to show which image regions influenced the model's prediction.

The final output is an **AI screening assessment**, risk level, referral recommendation, and screening report.

> **Important:** This MVP is a screening and decision-support prototype. It is not a replacement for an ophthalmologist or a clinically approved diagnostic system.

---

# 2. The Problem We Are Solving

The main challenges addressed by the project are:

- Large diabetic populations require scalable retinal screening.
- Rural PHCs may have limited access to ophthalmology specialists.
- Manual review of every fundus image does not scale easily.
- Portable or field-acquired fundus images may have poor quality.
- AI predictions can appear as black boxes without explanation.
- Healthcare workers need a simple workflow rather than a complex AI interface.

Therefore, the project focuses on four major capabilities:

1. **Fundus image-based DR screening**
2. **Image Quality Assessment before AI inference**
3. **Explainable AI using Grad-CAM**
4. **Risk and referral guidance for the PHC workflow**

---

# 3. Complete User Workflow

```text
Healthcare Worker
        |
        v
Login
        |
        v
PHC Dashboard
        |
        v
Select Existing Patient
        |
        +---- or ----> Register New Patient
                              |
                              v
                       Start New Screening
                              |
                              v
                    Select Left / Right Eye
                              |
                              v
                     Upload Fundus Image
                              |
                              v
                    Image Quality Assessment
                              |
                   +----------+----------+
                   |                     |
                   v                     v
             Poor Quality           Suitable Quality
                   |                     |
                   v                     v
            Recapture Image        AI DR Screening
                                         |
                                         v
                                  DR Severity Grade
                                         |
                                         v
                                   Confidence Score
                                         |
                                         v
                                  Grad-CAM Explanation
                                         |
                                         v
                                  Risk Classification
                                         |
                                         v
                                Referral Recommendation
                                         |
                                         v
                                   Screening Report
```

---

# 4. System Architecture

```text
                    +----------------------+
                    |   PHC HEALTHCARE     |
                    |       WORKER         |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |   NEXT.JS FRONTEND   |
                    | Dashboard / Patients |
                    | Upload / Results     |
                    +----------+-----------+
                               |
                               | REST API
                               v
                    +----------------------+
                    |   FASTAPI BACKEND    |
                    | API / Workflow Logic |
                    +----+------------+----+
                         |            |
                         v            v
              +---------------+  +----------------+
              | IMAGE QUALITY |  |   AI MODEL     |
              | OpenCV Checks |  | EfficientNet   |
              +---------------+  +----------------+
                         |            |
                         |            v
                         |       DR Grade
                         |            |
                         |            v
                         |        Grad-CAM
                         +-----+------+
                               |
                               v
                    +----------------------+
                    | SCREENING RESPONSE   |
                    | Quality / Prediction |
                    | Risk / Recommendation|
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |   NEXT.JS FRONTEND   |
                    | Result + Report UI   |
                    +----------------------+
```

---

# 5. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript |
| Styling | Tailwind CSS / existing component system |
| Authentication | Existing NextAuth v5 setup |
| Backend | FastAPI + Python |
| AI / Deep Learning | PyTorch |
| DR Model | EfficientNet or another agreed CNN architecture |
| Explainability | Grad-CAM |
| Image Processing | OpenCV |
| Database | MongoDB or agreed backend database |
| API Communication | REST + JSON |
| Image Storage | Local storage for MVP or backend-managed storage |

---

# 6. Team Responsibilities

## Member 1 – AI / CNN / Machine Learning

### Primary Goal
Build the AI pipeline that receives a suitable fundus image and produces a DR screening prediction.

### Responsibilities

- Prepare the DR dataset.
- Understand dataset labels and class mapping.
- Preprocess and resize fundus images.
- Select and configure the CNN model.
- Use transfer learning where appropriate.
- Train or fine-tune the DR classification model.
- Predict DR severity.
- Return prediction confidence/probabilities.
- Generate Grad-CAM visualization.
- Provide an inference function that can be called by the backend.

### Expected AI Output

```json
{
  "grade": 2,
  "label": "Moderate DR",
  "confidence": 0.918,
  "probabilities": {
    "0": 0.01,
    "1": 0.03,
    "2": 0.918,
    "3": 0.03,
    "4": 0.012
  },
  "heatmap_path": "path/to/heatmap.png"
}
```

### DR Grade Mapping

| Grade | Label |
|---|---|
| 0 | No DR |
| 1 | Mild DR |
| 2 | Moderate DR |
| 3 | Severe DR |
| 4 | Proliferative DR |

### Member 1 Deliverables

- Trained/fine-tuned model.
- Model weights.
- Image preprocessing function.
- Inference function.
- DR grade output.
- Confidence/probabilities.
- Grad-CAM generation.
- Clear documentation on how the backend should call the model.

---

## Member 2 – Backend / API / Image Quality

### Primary Goal
Build the FastAPI backend that connects the frontend, image-quality assessment, AI model, and database/workflow.

### Responsibilities

#### 1. FastAPI

Build REST endpoints for:

```text
POST /patients
GET  /patients
GET  /patients/{id}

POST /screenings
GET  /screenings/{id}
GET  /screenings

GET  /reports/{screeningId}
```

Exact endpoint names can be adjusted, but the frontend and backend must agree on the final contract.

#### 2. Fundus Image Handling

- Receive uploaded images.
- Validate file type.
- Validate file size.
- Store or temporarily manage uploaded images.
- Pass images to the quality-assessment pipeline.

#### 3. Image Quality Assessment

For the MVP, implement a practical image-quality gate using OpenCV or similar image-processing methods.

Recommended checks:

- Resolution
- Blur
- Brightness / illumination
- Contrast
- Optional fundus visibility if reliably implemented

Example:

```text
Fundus Image
      |
      v
Resolution Check
      |
      v
Blur Check
      |
      v
Brightness Check
      |
      v
Contrast Check
      |
      v
Quality Decision
```

If quality is poor:

```json
{
  "status": "poor",
  "score": 42,
  "issues": [
    "Image appears blurry",
    "Low illumination"
  ]
}
```

If quality is suitable:

```json
{
  "status": "good",
  "score": 95,
  "issues": []
}
```

> Thresholds should be tested on representative fundus images. Do not present simple heuristic checks as clinically validated image-quality AI.

#### 4. AI Integration

If image quality is suitable:

```text
Image
  |
  v
AI Model Inference
  |
  +--> DR Grade
  +--> Confidence
  +--> Grad-CAM
```

If quality fails, the backend should return a recapture response rather than pretending a reliable screening result exists.

#### 5. Risk Mapping

For the MVP, the backend may map model output into workflow-oriented risk categories:

| AI Screening Result | Prototype Workflow |
|---|---|
| No DR | Low Risk / Routine follow-up |
| Mild DR | Monitor / Follow-up recommended |
| Moderate DR | High Risk / Referral recommended |
| Severe DR | High Risk / Priority referral |
| Proliferative DR | Urgent / Specialist evaluation |
| Poor Quality | Recapture |

These are prototype workflow rules and should not be presented as autonomous clinical diagnosis.

### Member 2 Deliverables

- Working FastAPI server.
- Image upload endpoint.
- Image quality assessment.
- Integration with Member 1's inference code.
- Unified JSON response.
- Patient and screening APIs.
- Error handling.
- API documentation or example requests/responses.

---

## Member 3 – Frontend / Next.js

### Primary Goal
Build a simple, professional PHC healthcare-worker application that consumes backend APIs and presents the complete screening workflow.

### Completed / Main Responsibilities

#### Authentication

Preserve the existing:

- Login
- Registration
- Session handling
- Protected routes

#### Dashboard

Show:

- Total screened
- No DR
- At-risk cases
- Referrals
- Recent screenings
- New Patient Screening CTA

#### Patient Management

- Register patient.
- View patient list.
- Search patient.
- View patient details.
- Start screening for a selected patient.

#### New Screening

- Select patient.
- Select left or right eye.
- Upload fundus image.
- Preview uploaded image.
- Validate file type and size.
- Show processing state.

#### Image Quality UI

Display backend response:

```text
SUITABLE
- Resolution: Pass
- Blur: Pass
- Brightness: Pass
- Contrast: Pass
```

or:

```text
INSUFFICIENT QUALITY
- Image appears blurry
- Poor illumination

Action: Upload / Capture Again
```

#### AI Result UI

Display:

- AI Screening Result
- DR Grade
- Confidence
- Severity scale
- Original fundus image
- Grad-CAM visualization
- Risk classification
- Referral recommendation
- Medical disclaimer

#### Report

Display a printable screening report containing:

- PHC information
- Patient information
- Eye screened
- Image quality
- AI screening result
- Confidence
- Grad-CAM visualization
- Risk level
- Referral recommendation
- Disclaimer

### Member 3 Deliverables

- Complete Next.js UI.
- Responsive dashboard.
- Patient workflow.
- Fundus upload UI.
- Loading/error states.
- Quality result UI.
- AI result UI.
- Grad-CAM viewer.
- Screening history.
- Report page.
- Integration with FastAPI by replacing mock services with real API calls.

---

# 7. API Contract Between All Members

This is the most important integration agreement.

The frontend should not know how the CNN works.

The AI model should not know anything about Next.js.

FastAPI acts as the integration layer.

## Suggested Unified Response

```json
{
  "screening_id": "SCR-001",
  "patient_id": "P-001",
  "eye": "left",

  "image_quality": {
    "status": "good",
    "score": 95,
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
    "confidence": 0.918
  },

  "explanation": {
    "heatmap_url": "/results/SCR-001/heatmap.png"
  },

  "risk": {
    "level": "high",
    "recommendation": "Ophthalmologist referral recommended"
  }
}
```

If image quality fails:

```json
{
  "screening_id": "SCR-001",

  "image_quality": {
    "status": "poor",
    "score": 42,
    "checks": {
      "resolution": true,
      "brightness": false,
      "contrast": true,
      "blur": false
    },
    "issues": [
      "Image appears blurry",
      "Poor illumination"
    ]
  },

  "prediction": null,
  "explanation": null,

  "risk": {
    "level": "recapture",
    "recommendation": "Please capture or upload another fundus image."
  }
}
```

---

# 8. Critical Integration Flow

```text
STEP 1
Frontend uploads:
- patient_id
- eye
- image

        |
        v

STEP 2
FastAPI receives image

        |
        v

STEP 3
Image Quality Assessment

        |
   +----+----+
   |         |
 POOR       GOOD
   |         |
   v         v
Return      AI Model
Recapture       |
                v
           DR Prediction
                |
                v
             Grad-CAM
                |
                v
           Risk Mapping
                |
                v
          Unified JSON
                |
                v
             Frontend
```

---

# 9. MVP Priority

## P0 – Must Work

```text
Login
→ Dashboard
→ Select/Register Patient
→ Upload Fundus Image
→ Image Quality Assessment
→ AI Screening Result
→ Grad-CAM
→ Risk Classification
→ Referral Recommendation
```

This is the complete demo story.

## P1 – Important

- Patient directory
- Patient profile
- Screening history
- PHC profile
- Report page

## P2 – Only if Time Remains

- Advanced analytics
- PDF generation
- Advanced filters
- Real fundus camera integration
- SMS/notification workflows
- Complex role management
- Cloud deployment improvements

---

# 10. What Each Member Must Coordinate

Before integration, all three members should agree on:

1. Exact DR grade mapping.
2. Model input image size.
3. Accepted upload file types.
4. Maximum upload file size.
5. Image-quality checks actually implemented.
6. Quality status values.
7. JSON response structure.
8. Confidence value format.
9. Heatmap output format and URL/path.
10. Risk-level mapping.
11. Error response format.

Do not allow each member to invent their own API structure. Freeze the contract before final integration.

---

# 11. Suggested Final Demo

## Demo Story

1. Healthcare worker logs into the PHC system.
2. Dashboard shows current screening activity.
3. A diabetic patient is selected or registered.
4. Healthcare worker starts a new screening.
5. A fundus image is uploaded.
6. System checks image quality.
7. If the image is poor, the system explains why and requests recapture.
8. A suitable image proceeds to AI screening.
9. The AI returns a DR severity assessment.
10. Grad-CAM provides a visual explanation of influential image regions.
11. The system maps the screening result to a risk and referral workflow.
12. A screening report is displayed and can be printed.

## One-Line Project Pitch

**An AI-assisted Diabetic Retinopathy screening system for Primary Health Centres that combines fundus-image quality assessment, DR severity screening, explainable AI, and referral guidance in one simple healthcare workflow.**

---

# 12. Final Team Architecture

```text
                         FUNDUS IMAGE
                              |
                              v
                    +-------------------+
                    |   MEMBER 3        |
                    | Next.js Frontend  |
                    +---------+---------+
                              |
                              | REST API
                              v
                    +-------------------+
                    |   MEMBER 2        |
                    | FastAPI Backend   |
                    +---------+---------+
                              |
                 +------------+------------+
                 |                         |
                 v                         v
        IMAGE QUALITY CHECK          MEMBER 1 AI
           OpenCV / Rules          CNN / EfficientNet
                 |                         |
                 |                         v
                 |                     DR Grade
                 |                         |
                 |                         v
                 |                      Grad-CAM
                 +------------+------------+
                              |
                              v
                       UNIFIED RESPONSE
                              |
                              v
                    +-------------------+
                    |   MEMBER 3        |
                    | Results / Report  |
                    +-------------------+
```

---

# 13. Important Presentation Rule

Do not claim:

- The system is clinically validated unless you have performed proper validation.
- The model is medically approved.
- The AI independently diagnoses patients.
- Grad-CAM proves a specific lesion is present.
- A confidence score is the same as model accuracy.

Use terms such as:

- **AI Screening Result**
- **Screening Assessment**
- **Decision Support**
- **Referral Recommendation**
- **Prototype / MVP**

---

# 14. Final Goal

The goal is not to build a full hospital management system.

The goal is to demonstrate one strong, believable end-to-end workflow:

> **A PHC healthcare worker can upload a fundus image, verify that the image is suitable for screening, obtain an AI-assisted DR severity assessment with an explanation, and receive clear guidance about follow-up or specialist referral.**

If this pipeline works reliably from frontend to backend to AI model and back, the MVP is successful.
