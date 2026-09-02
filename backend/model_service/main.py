"""Standalone DR model service. Runs on its OWN Render instance (separate
512Mi budget) so torch + EfficientNet + GradCAM never share memory with the
backend API. Exposes POST /predict — receives image bytes, returns prediction
+ heatmap PNG.

Kept intentionally dependency-light: no MongoDB, no backend auth. It imports
the existing model + gradcam logic from ../app/model/src.
"""
import os
import sys
import traceback
from pathlib import Path

# Thread-pinning BEFORE torch import (single-thread reduces per-process RAM)
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")

BACKEND_DIR = Path(__file__).resolve().parents[1]
MODEL_SRC = BACKEND_DIR / "app" / "model" / "src"
sys.path.insert(0, str(MODEL_SRC))
sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import numpy as np

# Lazy heavy imports inside request handlers keep startup light; the model is
# cached after the first /predict so RAM stays flat after warm-up.
_model = None
_device = None


class PredictRequest(BaseModel):
    image_b64: str
    screening_id: str = ""


app = FastAPI(title="NetraCare Model Service")


def get_model():
    global _model, _device
    if _model is not None:
        return _model, _device
    import torch
    from model import create_model

    torch.set_num_threads(1)
    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    ckpt = BACKEND_DIR / "app" / "model" / "checkpoints" / "best_model.pth"
    _model = create_model(checkpoint_path=str(ckpt)).to(_device).eval()
    return _model, _device


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _model is not None}


@app.post("/predict")
def predict(req: PredictRequest):
    import base64
    import io
    import torch
    from PIL import Image
    from inference import get_transform

    try:
        raw = base64.b64decode(req.image_b64)
        image = Image.open(io.BytesIO(raw)).convert("RGB")
        width, height = image.size
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image data")

    model, device = get_model()

    # ---- CNN inference ----
    transform = get_transform()
    input_tensor = transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        output = model(input_tensor)
    probs = torch.softmax(output, dim=1)
    probs_np = probs[0].cpu().numpy()
    grade = int(np.argmax(probs_np))

    from app.core.config import GRADE_LABELS
    prediction = {
        "grade": grade,
        "label": GRADE_LABELS[grade],
        "confidence": round(float(probs_np[grade]), 2),
        "probabilities": {
            cls: round(float(p), 2)
            for cls, p in zip(
                ["No DR", "Mild DR", "Moderate DR", "Severe DR", "Proliferative DR"],
                probs_np,
            )
        },
    }

    # ---- GradCAM ----
    heatmap_b64 = None
    try:
        from gradcam import GradCAM

        input_tensor = transform(image).unsqueeze(0).to(device)
        input_tensor.requires_grad_()
        target_layer = model.features[-1][0]

        with torch.no_grad():
            predicted = model(input_tensor).argmax(dim=1).item()

        gc_inst = GradCAM(model=model, target_layer=target_layer)
        try:
            cam = gc_inst.generate(input_tensor, predicted)
        finally:
            gc_inst.close()

        # Heatmap as PNG (pure numpy/PIL, no cv2)
        cam_np = cam  # (H,W) float 0-1
        cam_img = Image.fromarray((np.clip(cam_np, 0, 1) * 255).astype(np.uint8)).resize(
            (width, height), Image.BILINEAR
        )
        heat_rgb = _jet(np.array(cam_img))
        orig_np = np.array(image.resize((width, height))).astype(np.float32)
        overlay = np.clip(orig_np * 0.6 + heat_rgb * 0.4, 0, 255).astype(np.uint8)

        buf = io.BytesIO()
        Image.fromarray(overlay).save(buf, format="PNG")
        heatmap_b64 = base64.b64encode(buf.getvalue()).decode()

        del cam, cam_img, heat_rgb, orig_np, overlay, input_tensor
        # never delete model — cached for next request
        if device.type == "cpu":
            torch.cuda.empty_cache() if torch.cuda.is_available() else None
        import gc as _gc
        _gc.collect()
    except Exception:
        # GradCAM is best-effort; never fail the whole prediction for it
        traceback.print_exc()

    return {
        "status": "completed",
        "prediction": prediction,
        "explanation": None,
        "heatmap_b64": heatmap_b64,
    }


def _jet(gray):
    """Blue->Cyan->Green->Yellow->Red (jet) colormap in RGB, no cv2."""
    v = gray.astype(np.float32) / 255.0
    r = np.clip(1.5 - abs(4 * v - 3), 0, 1)
    g = np.clip(1.5 - abs(4 * v - 2), 0, 1)
    b = np.clip(1.5 - abs(4 * v - 1), 0, 1)
    return np.stack([r, g, b], axis=2)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"error": str(exc)})
