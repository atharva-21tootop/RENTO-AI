from datetime import datetime, timezone

from fastapi import HTTPException

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.utils.mongo_utils import strip_id
from .schemas import OtpPurpose, UserCreate
from . import otp as otp_service


def _user_public(doc: dict) -> dict:
    user_id = doc["_id"]
    d = strip_id(dict(doc))
    return {
        "id": str(user_id),
        "name": d.get("name", ""),
        "email": d["email"],
        "provider": d.get("provider", "credentials"),
        "role": d.get("role", "phc_staff"),
        "phc_id": str(d["phc_id"]) if d.get("phc_id") else None,
        "is_verified": d.get("is_verified", False),
        "created_at": d.get("created_at"),
    }


def _to_claims(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "email": doc["email"],
        "name": doc.get("name", ""),
        "role": doc.get("role", "phc_staff"),
        "phcId": str(doc["phc_id"]) if doc.get("phc_id") else None,
        "provider": doc.get("provider", "credentials"),
    }


def register(data: UserCreate) -> dict:
    db = get_db()
    email = data.email

    existing = db.users.find_one({"email": email})
    if existing and existing.get("is_verified"):
        raise HTTPException(400, "A user with this email address already exists.")

    phc = db.phcs.find_one({"code": data.phc_code})
    if not phc:
        res = db.phcs.insert_one({
            "name": data.phc_name,
            "code": data.phc_code,
            "state": data.state,
            "district": data.district,
            "address": data.address,
            "contact_number": data.contact_number,
            "healthcare_worker_name": data.name,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        phc = {"_id": res.inserted_id}

    if existing and not existing.get("is_verified"):
        db.users.update_one({"_id": existing["_id"]}, {"$set": {
            "name": data.name,
            "password_hash": hash_password(data.password),
            "phc_id": phc["_id"],
        }})
        user_id = existing["_id"]
    else:
        res = db.users.insert_one({
            "name": data.name,
            "email": email,
            "password_hash": hash_password(data.password),
            "provider": "credentials",
            "role": "phc_staff",
            "phc_id": phc["_id"],
            "is_verified": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        user_id = res.inserted_id

    otp_service.create_and_send_otp(email, OtpPurpose.register)
    return {"id": str(user_id), "email": email, "phc_id": str(phc["_id"])}


def verify_otp(email: str, otp: str, purpose: OtpPurpose):
    db = get_db()
    email = email.lower().strip()
    if not otp_service.verify_otp(email, otp, purpose):
        raise HTTPException(400, "Invalid, expired, or too many failed verification attempts.")

    if purpose in (OtpPurpose.register, OtpPurpose.email_verification):
        user = db.users.find_one({"email": email})
        if not user:
            raise HTTPException(404, "User account not found")
        db.users.update_one({"_id": user["_id"]}, {"$set": {"is_verified": True}})
        return "Email verified successfully! You can now log in."
    return "OTP verified successfully. Proceed to reset password."


def resend_otp(email: str, purpose: OtpPurpose) -> str:
    db = get_db()
    email = email.lower().strip()
    user = db.users.find_one({"email": email})

    if not user and purpose not in (OtpPurpose.reset_password, OtpPurpose.password_reset):
        raise HTTPException(404, "No user found with this email address")
    if not user and purpose in (OtpPurpose.reset_password, OtpPurpose.password_reset):
        return "If an account exists with this email, a new verification code has been sent."

    if purpose in (OtpPurpose.register, OtpPurpose.email_verification) and user.get("is_verified"):
        raise HTTPException(400, "This email is already verified. You can log in.")

    recent = db.otps.find_one({"email": email, "purpose": purpose.value})
    if recent and recent.get("last_sent_at"):
        elapsed = (datetime.now(timezone.utc) - recent["last_sent_at"]).total_seconds()
        if elapsed < otp_service.RESEND_COOLDOWN_SECONDS:
            remaining = int(otp_service.RESEND_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(429, f"Please wait {remaining} seconds before requesting another code.")

    otp_service.create_and_send_otp(email, purpose)
    return "A new 6-digit verification code has been sent to your email."


def login(email: str, password: str) -> dict:
    db = get_db()
    user = db.users.find_one({"email": email.lower().strip()})
    if not user or not verify_password(password, user.get("password_hash", "")):
        raise HTTPException(401, "Invalid email or password")
    if not user.get("is_verified"):
        raise HTTPException(403, "Please verify your email address before logging in.")
    return {
        "access_token": create_access_token(_to_claims(user)),
        "token_type": "bearer",
        "user": _user_public(user),
    }


def google_login(google_id: str, email: str, name: str) -> dict:
    db = get_db()
    email = (email or "").lower().strip()
    user = db.users.find_one({"email": email})
    if user:
        db.users.update_one({"_id": user["_id"]}, {"$set": {"name": name or user.get("name", ""), "is_verified": True}})
    else:
        res = db.users.insert_one({
            "name": name or "Google User",
            "email": email,
            "password_hash": "",
            "provider": "google",
            "role": "phc_staff",
            "phc_id": None,
            "is_verified": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        user = {"_id": res.inserted_id, "email": email, "name": name or "Google User",
                "provider": "google", "role": "phc_staff", "phc_id": None, "is_verified": True}
    return {
        "access_token": create_access_token(_to_claims(user)),
        "token_type": "bearer",
        "user": _user_public(user),
    }


def forgot_password(email: str) -> str:
    db = get_db()
    email = email.lower().strip()
    generic = "If an account exists with this email address, a 6-digit password reset code has been sent."
    user = db.users.find_one({"email": email})
    if not user or user.get("provider") == "google" or not user.get("password_hash"):
        return generic
    otp_service.create_and_send_otp(email, OtpPurpose.reset_password)
    return generic


def reset_password(email: str, otp: str, password: str) -> str:
    db = get_db()
    email = email.lower().strip()
    if not otp_service.verify_otp(email, otp, OtpPurpose.reset_password):
        raise HTTPException(400, "Invalid, expired, or too many failed reset attempts.")
    user = db.users.find_one({"email": email})
    if not user:
        raise HTTPException(404, "User account not found")
    db.users.update_one({"_id": user["_id"]}, {"$set": {"password_hash": hash_password(password)}})
    db.otps.delete_many({"email": email, "purpose": OtpPurpose.reset_password.value})
    return "Password updated successfully! You can now log in with your new password."