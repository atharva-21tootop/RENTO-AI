from fastapi import HTTPException

from app.core.database import get_db
from .schemas import PHCProfileUpdate

_PUBLIC_KEYS = (
    "name", "code", "state", "district", "address",
    "contact_number", "healthcare_worker_name",
)


def _public(doc: dict) -> dict:
    d = {k: v for k, v in doc.items() if k in _PUBLIC_KEYS}
    d["id"] = str(doc["_id"])
    d["contactNumber"] = d.pop("contact_number", "")
    d["healthcareWorkerName"] = d.pop("healthcare_worker_name", "")
    return d


def _require_phc(phc_id):
    if not phc_id:
        raise HTTPException(status_code=404, detail="No PHC associated with this account")
    from bson import ObjectId
    db = get_db()
    phc = db.phcs.find_one({"_id": ObjectId(phc_id)})
    if not phc:
        raise HTTPException(status_code=404, detail="No associated PHC profile found")
    return db, phc


def get_profile(phc_id) -> dict:
    db, phc = _require_phc(phc_id)
    return _public(phc)


def update_profile(phc_id, data: PHCProfileUpdate) -> dict:
    db, phc = _require_phc(phc_id)

    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name.strip()
    if data.code is not None:
        update_data["code"] = data.code.upper().strip()
    if data.state is not None:
        update_data["state"] = data.state.strip()
    if data.district is not None:
        update_data["district"] = data.district.strip()
    if data.address is not None:
        update_data["address"] = data.address.strip()
    if data.contactNumber is not None:
        update_data["contact_number"] = data.contactNumber.strip()
    if data.healthcareWorkerName is not None:
        update_data["healthcare_worker_name"] = data.healthcareWorkerName.strip()

    if update_data:
        db.phcs.update_one({"_id": phc["_id"]}, {"$set": update_data})
    return _public(db.phcs.find_one({"_id": phc["_id"]}))