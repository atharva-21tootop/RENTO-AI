from fastapi import APIRouter
from .service import get_report_summary

router = APIRouter()


@router.get("/summary")
def reports_summary_endpoint():
    return get_report_summary()