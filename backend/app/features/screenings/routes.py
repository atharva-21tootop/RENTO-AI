import os
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Depends
from .schemas import ScreeningCreate, ScreeningResponse
from .service import (
    create_screening, get_screening, update_screening,
    list_screenings, get_patients_batch,
)
from ..patients.service import get_patient
from .image import (
    generate_safe_filename,
    save_image,
    get_image_url,
    validate_image,
)
from .quality import assess_image_quality
from .inference import run_inference
from .gradcam import generate_gradcam
from .risk import map_grade_to_risk, get_poor_image_risk
from app.core.config import MAX_UPLOAD_SIZE_MB, GRADE_LABELS, GRADE_DESCRIPTIONS
from app.core.auth import get_current_user

router = APIRouter()


def _enrich_screening(screening: Dict, patient: Optional[Dict] = None) -> Dict:
    """Add patient details and prediction metadata to a screening."""
    if patient is None:
        patient = get_patient(screening["patient_id"])
    enriched = dict(screening)
    if patient:
        enriched["patient_name"] = patient["name"]
        enriched["patient_age"] = patient["age"]
        enriched["patient_gender"] = patient["gender"]
        enriched["diabetes_duration_years"] = patient.get("diabetes_duration_years")
    prediction = screening.get("prediction")
    if prediction and "description" not in prediction:
        grade = prediction.get("grade", 0)
        enriched_prediction = dict(prediction)
        enriched_prediction["description"] = GRADE_DESCRIPTIONS.get(grade, "Consult specialist.")
        enriched_prediction["label"] = GRADE_LABELS.get(grade, f"Grade {grade}")
        enriched["prediction"] = enriched_prediction
    return enriched


@router.post("", response_model=ScreeningResponse, status_code=201)
def create_screening_endpoint(data: ScreeningCreate, user: dict = Depends(get_current_user)):
    patient = get_patient(data.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail={"code": "PATIENT_NOT_FOUND", "message": "Patient not found"})
    if data.eye not in ["left", "right"]:
        raise HTTPException(status_code=422, detail={"code": "INVALID_EYE", "message": "Eye must be 'left' or 'right'"})
    screening = create_screening(data.patient_id, data.eye)
    return _enrich_screening(screening)


@router.post("/{screening_id}/image")
async def upload_image_endpoint(screening_id: str, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    screening = get_screening(screening_id)
    if not screening:
        raise HTTPException(status_code=404, detail={"code": "SCREENING_NOT_FOUND", "message": "Screening not found"})

    if file.content_type not in ["image/jpeg", "image/jpg", "image/png"]:
        raise HTTPException(status_code=415, detail={"code": "UNSUPPORTED_TYPE", "message": "Only JPG, JPEG, and PNG are supported"})

    file_bytes = await file.read()
    max_bytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(status_code=413, detail={"code": "FILE_TOO_LARGE", "message": f"File exceeds {MAX_UPLOAD_SIZE_MB}MB limit"})

    if not validate_image(file_bytes, file.content_type):
        raise HTTPException(status_code=422, detail={"code": "INVALID_IMAGE", "message": "File cannot be decoded as an image"})

    filename = generate_safe_filename(screening_id, file.filename or "image.jpg")
    save_image(file_bytes, filename)
    image_url = get_image_url(filename)

    update_screening(screening_id, {
        "status": "image_uploaded",
        "image_path": os.path.join("storage", "uploads", filename),
        "image_url": image_url,
    })

    return {"screening_id": screening_id, "image_uploaded": True, "image_url": image_url}


@router.post("/{screening_id}/quality")
def quality_check_endpoint(screening_id: str, user: dict = Depends(get_current_user)):
    screening = get_screening(screening_id)
    if not screening:
        raise HTTPException(status_code=404, detail={"code": "SCREENING_NOT_FOUND", "message": "Screening not found"})
    if not screening.get("image_path"):
        raise HTTPException(status_code=400, detail={"code": "NO_IMAGE", "message": "No image uploaded for this screening"})

    update_screening(screening_id, {"status": "quality_checking"})
    quality = assess_image_quality(screening["image_path"])
    update_screening(screening_id, {"image_quality": quality, "status": "quality_failed" if quality["status"] == "poor" else "image_uploaded"})
    return quality


@router.post("/{screening_id}/analyze")
def analyze_endpoint(screening_id: str, user: dict = Depends(get_current_user)):
    screening = get_screening(screening_id)
    if not screening:
        raise HTTPException(status_code=404, detail={"code": "SCREENING_NOT_FOUND", "message": "Screening not found"})
    if not screening.get("image_path"):
        raise HTTPException(status_code=400, detail={"code": "NO_IMAGE", "message": "No image uploaded for this screening"})

    update_screening(screening_id, {"status": "quality_checking"})
    quality = assess_image_quality(screening["image_path"])
    update_screening(screening_id, {"image_quality": quality})

    if quality["status"] == "poor":
        risk = get_poor_image_risk()
        update_screening(screening_id, {"status": "quality_failed", "risk": risk})
        result = {
            "screening_id": screening_id,
            "patient_id": screening["patient_id"],
            "eye": screening["eye"],
            "status": "quality_failed",
            "image_url": screening.get("image_url"),
            "image_quality": quality,
            "risk": risk,
        }
        return _enrich_screening(result)

    update_screening(screening_id, {"status": "ai_processing"})
    try:
        prediction = run_inference(screening["image_path"])
        heatmap_url = generate_gradcam(screening["image_path"], screening_id)
    except Exception as e:
        update_screening(screening_id, {"status": "failed"})
        raise HTTPException(status_code=503, detail={"code": "AI_SERVICE_UNAVAILABLE", "message": "AI model or Grad-CAM service failed"})

    risk = map_grade_to_risk(prediction["grade"])

    update_screening(screening_id, {
        "status": "completed",
        "prediction": prediction,
        "explanation": {"heatmap_url": heatmap_url},
        "risk": risk,
    })

    result = {
        "screening_id": screening_id,
        "patient_id": screening["patient_id"],
        "eye": screening["eye"],
        "status": "completed",
        "image_url": screening.get("image_url"),
        "image_quality": quality,
        "prediction": prediction,
        "explanation": {"heatmap_url": heatmap_url},
        "risk": risk,
    }
    return _enrich_screening(result)


@router.get("/{screening_id}")
def get_screening_endpoint(screening_id: str):
    screening = get_screening(screening_id)
    if not screening:
        raise HTTPException(status_code=404, detail={"code": "SCREENING_NOT_FOUND", "message": "Screening not found"})
    enriched = _enrich_screening(screening)
    return {
        "screening_id": enriched["screening_id"],
        "patient_id": enriched["patient_id"],
        "eye": enriched["eye"],
        "status": enriched["status"],
        "image_url": enriched.get("image_url"),
        "image_quality": enriched.get("image_quality"),
        "prediction": enriched.get("prediction"),
        "explanation": enriched.get("explanation"),
        "risk": enriched.get("risk"),
        "patient_name": enriched.get("patient_name"),
        "patient_age": enriched.get("patient_age"),
        "patient_gender": enriched.get("patient_gender"),
        "diabetes_duration_years": enriched.get("diabetes_duration_years"),
        "created_at": enriched.get("created_at"),
    }


@router.get("")
def list_screenings_endpoint(
    patient_id: Optional[str] = Query(None),
    risk: Optional[str] = Query(None),
    grade: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    items, total = list_screenings(
        patient_id=patient_id,
        risk=risk,
        grade=grade,
        date_from=date_from,
        date_to=date_to,
        page=page,
        limit=limit,
    )
    patient_ids = [item["patient_id"] for item in items]
    patient_map = get_patients_batch(patient_ids)
    enriched_items = [
        _enrich_screening(item, patient=patient_map.get(item["patient_id"]))
        for item in items
    ]
    return {
        "items": enriched_items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": max(1, -(-total // limit)),
    }