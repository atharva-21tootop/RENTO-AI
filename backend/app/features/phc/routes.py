from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from .schemas import PHCProfileUpdate
from .service import get_profile, update_profile

router = APIRouter()


@router.get("/profile")
def get_phc_profile(user: dict = Depends(get_current_user)):
    return get_profile(user.get("phcId"))


@router.put("/profile")
def update_phc_profile(data: PHCProfileUpdate, user: dict = Depends(get_current_user)):
    return update_profile(user.get("phcId"), data)