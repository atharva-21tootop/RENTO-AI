from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from app.core.config import AUTH_SECRET, SESSION_COOKIE_NAME

security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """Verify a backend-issued HS256 JWT from the Bearer header or the session cookie."""
    token = None
    if credentials:
        token = credentials.credentials
    elif SESSION_COOKIE_NAME in request.cookies:
        token = request.cookies[SESSION_COOKIE_NAME]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "MISSING_TOKEN", "message": "Authorization token is required"},
        )

    try:
        payload = jwt.decode(
            token,
            AUTH_SECRET,
            algorithms=["HS256"],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_EXPIRED", "message": "Token has expired"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Token is invalid"},
        )

    if not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Token missing user ID"},
        )

    return {
        "id": payload["sub"],
        "email": payload.get("email"),
        "name": payload.get("name"),
        "role": payload.get("role", "phc_staff"),
        "phcId": payload.get("phcId"),
        "provider": payload.get("provider", "credentials"),
        "needs_profile": payload.get("needs_profile", False),
    }
