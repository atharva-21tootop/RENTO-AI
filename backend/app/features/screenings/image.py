import os
import cv2
import numpy as np
from app.core.config import UPLOAD_DIR
from app.core.signed_url import sign_url


def generate_safe_filename(screening_id: str, original_filename: str) -> str:
    ext = os.path.splitext(original_filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png"]:
        ext = ".jpg"
    return f"{screening_id}{ext}"


def save_image(file_bytes: bytes, filename: str) -> str:
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(file_bytes)
    return filepath


def get_image_url(filename: str) -> str:
    return sign_url("uploads", filename)


def validate_image(file_bytes: bytes, content_type: str) -> bool:
    if content_type not in ["image/jpeg", "image/jpg", "image/png"]:
        return False
    try:
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img is not None
    except Exception:
        return False