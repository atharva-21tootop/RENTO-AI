import cv2
import numpy as np
from typing import Dict, List, Tuple


MIN_WIDTH = 512
MIN_HEIGHT = 512
BLUR_THRESHOLD = 100.0
BRIGHTNESS_MIN = 40
BRIGHTNESS_MAX = 220
CONTRAST_THRESHOLD = 30.0


def check_resolution(img) -> Tuple[bool, str]:
    h, w = img.shape[:2]
    if w < MIN_WIDTH or h < MIN_HEIGHT:
        return False, f"Resolution too low ({w}x{h}, min {MIN_WIDTH}x{MIN_HEIGHT})"
    return True, ""


def check_blur(img) -> Tuple[bool, str]:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < BLUR_THRESHOLD:
        return False, "Image appears blurry"
    return True, ""


def check_brightness(img) -> Tuple[bool, str]:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    if mean_brightness < BRIGHTNESS_MIN:
        return False, "Image is too dark"
    if mean_brightness > BRIGHTNESS_MAX:
        return False, "Image is too bright"
    return True, ""


def check_contrast(img) -> Tuple[bool, str]:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    contrast = np.std(gray)
    if contrast < CONTRAST_THRESHOLD:
        return False, "Low contrast"
    return True, ""


def assess_image_quality(image_path: str) -> Dict:
    img = cv2.imread(image_path)
    if img is None:
        return {
            "status": "poor",
            "score": 0.0,
            "checks": {
                "resolution": False,
                "brightness": False,
                "contrast": False,
                "blur": False,
                "fundus_visibility": False,
            },
            "issues": ["Unable to read image file"],
            "action": "recapture",
        }

    checks = {}
    issues = []

    res_ok, res_msg = check_resolution(img)
    checks["resolution"] = res_ok
    if not res_ok:
        issues.append(res_msg)

    blur_ok, blur_msg = check_blur(img)
    checks["blur"] = blur_ok
    if not blur_ok:
        issues.append(blur_msg)

    bright_ok, bright_msg = check_brightness(img)
    checks["brightness"] = bright_ok
    if not bright_ok:
        issues.append(bright_msg)

    contrast_ok, contrast_msg = check_contrast(img)
    checks["contrast"] = contrast_ok
    if not contrast_ok:
        issues.append(contrast_msg)

    passed = sum(checks.values())
    total = len(checks)
    score = round(passed / total, 2)

    if score >= 0.75:
        status = "good"
        action = None
    else:
        status = "poor"
        action = "recapture"

    # Fundus visibility: heuristic — if resolution, brightness, and blur pass,
    # the retinal fundus is likely visible.  Full CNN-based detection is done by
    # the AI model upstream.
    checks["fundus_visibility"] = checks.get("resolution", False) and checks.get("brightness", False) and checks.get("blur", False)

    return {
        "status": status,
        "score": score,
        "checks": checks,
        "issues": issues,
        "action": action,
    }