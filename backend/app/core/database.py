from pymongo import MongoClient, ASCENDING, DESCENDING
from app.core.config import MONGODB_URL, DATABASE_NAME

client: MongoClient = None
db = None


def connect_db():
    global client, db
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    _ensure_indexes()
    return db


def _ensure_indexes():
    """Create indexes for performance on commonly queried fields."""
    db.patients.create_index([("patient_id", ASCENDING)], unique=True, name="idx_patient_id")
    db.patients.create_index([("name", ASCENDING)], name="idx_patient_name")
    db.screenings.create_index([("patient_id", ASCENDING)], name="idx_screening_patient_id")
    db.screenings.create_index([("created_at", DESCENDING)], name="idx_screening_created_at")
    db.screenings.create_index([("prediction.grade", ASCENDING)], name="idx_screening_grade")
    db.screenings.create_index([("risk.level", ASCENDING)], name="idx_screening_risk_level")
    db.screenings.create_index([("status", ASCENDING)], name="idx_screening_status")


def get_db():
    global db
    if db is None:
        connect_db()
    return db


def close_db():
    global client
    if client:
        client.close()
