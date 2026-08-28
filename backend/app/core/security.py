from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
from jose import jwt

from app.core.config import AUTH_SECRET

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24h


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(payload: dict, expires_minutes: Optional[int] = None) -> str:
    """Sign a NextAuth-compatible HS256 JWT.

    The ``sub`` claim carries the user id so the existing
    ``get_current_user`` verifier (which reads payload['sub']) accepts
    tokens issued here.
    """
    data = dict(payload)
    if "sub" not in data and "id" in data:
        data["sub"] = data["id"]
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES
    )
    data["exp"] = expire
    return jwt.encode(data, AUTH_SECRET, algorithm=ALGORITHM)
