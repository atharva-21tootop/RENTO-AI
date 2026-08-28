from app.core.database import get_db


def get_report_summary() -> dict:
    db = get_db()
    total_patients = db.patients.count_documents({})
    total_screenings = db.screenings.count_documents({})
    completed = db.screenings.count_documents({"status": "completed"})
    quality_failed = db.screenings.count_documents({"status": "quality_failed"})

    grade_counts = {}
    for grade in range(5):
        grade_counts[str(grade)] = db.screenings.count_documents({"prediction.grade": grade})

    risk_counts = {}
    for level in ["low", "monitor", "high", "urgent", "recapture"]:
        risk_counts[level] = db.screenings.count_documents({"risk.level": level})

    return {
        "total_patients": total_patients,
        "total_screenings": total_screenings,
        "completed_screenings": completed,
        "quality_failed_screenings": quality_failed,
        "grade_distribution": grade_counts,
        "risk_distribution": risk_counts,
    }