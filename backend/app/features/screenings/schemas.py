from typing import Optional, Dict
from pydantic import BaseModel


class ScreeningCreate(BaseModel):
    patient_id: str
    eye: str


class ScreeningResponse(BaseModel):
    screening_id: str
    patient_id: str
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    diabetes_duration_years: Optional[int] = None
    eye: str
    status: str
    image_url: Optional[str] = None
    image_quality: Optional[Dict] = None
    prediction: Optional[Dict] = None
    explanation: Optional[Dict] = None
    risk: Optional[Dict] = None
    created_at: Optional[str] = None