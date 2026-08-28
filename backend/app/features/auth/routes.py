import re
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, field_validator

from .schemas import UserCreate, OtpPurpose
from app.core.auth import get_current_user
from . import service as auth_service

router = APIRouter()

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class _EmailBody(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def _norm_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError("Please enter a valid email address")
        return v


class OtpBody(_EmailBody):
    purpose: OtpPurpose


class VerifyOtpBody(OtpBody):
    otp: str = Field(pattern=r"^\d{6}$")


class ResendOtpBody(OtpBody):
    pass


class LoginBody(_EmailBody):
    password: str = Field(min_length=1)


class GoogleOauthBody(BaseModel):
    google_id: str
    email: Optional[str] = None
    name: Optional[str] = None


class ForgotPasswordBody(_EmailBody):
    pass


class ResetPasswordBody(_EmailBody):
    otp: str = Field(pattern=r"^\d{6}$")
    password: str = Field(min_length=8, max_length=100)


@router.post("/register", status_code=201)
def register_endpoint(data: UserCreate):
    return auth_service.register(data)


@router.post("/verify-otp")
def verify_otp_endpoint(data: VerifyOtpBody):
    return {"message": auth_service.verify_otp(data.email, data.otp, data.purpose)}


@router.post("/resend-otp")
def resend_otp_endpoint(data: ResendOtpBody):
    return {"message": auth_service.resend_otp(data.email, data.purpose)}


@router.post("/login")
def login_endpoint(data: LoginBody):
    return auth_service.login(data.email, data.password)


@router.post("/oauth/google")
def google_oauth_endpoint(data: GoogleOauthBody):
    return auth_service.google_login(data.google_id, data.email or "", data.name or "")


@router.post("/forgot-password")
def forgot_password_endpoint(data: ForgotPasswordBody):
    return {"message": auth_service.forgot_password(data.email)}


@router.post("/reset-password")
def reset_password_endpoint(data: ResetPasswordBody):
    return {"message": auth_service.reset_password(data.email, data.otp, data.password)}


@router.get("/me")
def me_endpoint(user: dict = Depends(get_current_user)):
    return user