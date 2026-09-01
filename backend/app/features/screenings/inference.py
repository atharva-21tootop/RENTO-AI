import sys
from functools import lru_cache
from pathlib import Path
from typing import Dict
from app.core.config import GRADE_LABELS

MODEL_DIR = Path(__file__).resolve().parents[2] / "model"
SRC_DIR = MODEL_DIR / "src"
CHECKPOINT_PATH = MODEL_DIR / "checkpoints" / "best_model.pth"


def _ensure_src_importable():
    if str(SRC_DIR) not in sys.path:
        sys.path.insert(0, str(SRC_DIR))


@lru_cache(maxsize=1)
def get_model():
    """Load the trained DR model once and reuse it across requests."""
    if not CHECKPOINT_PATH.exists():
        raise FileNotFoundError(f"DR checkpoint not found at {CHECKPOINT_PATH}")
    _ensure_src_importable()
    import torch
    torch.set_num_threads(1)
    from model import create_model
    model = create_model(checkpoint_path=str(CHECKPOINT_PATH))
    model.eval()
    if torch.cuda.is_available():
        model = model.cuda()
    return model


def _get_device():
    import torch
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


def run_inference(image_path: str) -> Dict:
    _ensure_src_importable()
    from PIL import Image
    from inference import predict_dr

    device = _get_device()
    model = get_model().to(device)
    image = Image.open(image_path).convert("RGB")
    result = predict_dr(model, image, device)

    grade = result["grade"]
    return {
        "grade": grade,
        "label": GRADE_LABELS[grade],
        "confidence": round(result["confidence"], 2),
        "probabilities": {
            cls: round(p, 2)
            for cls, p in result["probabilities"].items()
        },
    }