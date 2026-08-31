from datetime import datetime, timezone
from typing import Optional, List, Dict, Tuple
from app.core.database import get_db


def _generate_screening_id() -> str:
    db = get_db()
    counter = db.counters.find_one_and_update(
        {"_id": "screening_id"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return f"SCR-{counter['seq']:04d}"


from bson import ObjectId


def create_screening(patient_id: str, eye: str, phc_id: Optional[str] = None) -> Dict:
    db = get_db()
    screening_id = _generate_screening_id()
    screening = {
        "screening_id": screening_id,
        "patient_id": patient_id,
        "eye": eye,
        "status": "created",
        "image_path": None,
        "image_url": None,
        "image_quality": None,
        "prediction": None,
        "explanation": None,
        "risk": None,
        "phc_id": ObjectId(phc_id) if phc_id else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    db.screenings.insert_one(screening)
    return screening


def get_screening(screening_id: str) -> Optional[Dict]:
    db = get_db()
    return db.screenings.find_one({"screening_id": screening_id}, {"_id": 0})


def update_screening(screening_id: str, update_data: Dict) -> None:
    db = get_db()
    db.screenings.update_one({"screening_id": screening_id}, {"$set": update_data})


def list_screenings(
    patient_id: Optional[str] = None,
    risk: Optional[str] = None,
    grade: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    phc_id: Optional[str] = None,
) -> Tuple[List[Dict], int]:
    db = get_db()
    if not phc_id:
        return [], 0
    query = {"phc_id": ObjectId(phc_id)}
    if patient_id:
        query["patient_id"] = patient_id
    if grade is not None:
        query["prediction.grade"] = grade
    if risk:
        query["risk.level"] = risk
    if date_from:
        query.setdefault("created_at", {})["$gte"] = date_from
    if date_to:
        query.setdefault("created_at", {})["$lte"] = date_to
    total = db.screenings.count_documents(query)
    skip = (page - 1) * limit
    items = list(db.screenings.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1))
    return items, total


def get_patients_batch(patient_ids: List[str]) -> Dict[str, Dict]:
    """Fetch multiple patients in one query — avoids N+1 in list enrichment."""
    if not patient_ids:
        return {}
    db = get_db()
    unique_ids = list(set(patient_ids))
    docs = db.patients.find({"patient_id": {"$in": unique_ids}}, {"_id": 0})
    return {doc["patient_id"]: doc for doc in docs}