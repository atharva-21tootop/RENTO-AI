#!/usr/bin/env python3
"""Standalone inference worker — quality check + CNN inference only (no
GradCAM). Runs as a subprocess so the main uvicorn process never loads
torch/cv2 and stays under the Render 512Mi cap."""
import os, sys, json, gc

os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"

BACKEND = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
sys.path.insert(0, BACKEND)
MODEL_SRC = os.path.join(BACKEND, "app", "model", "src")
sys.path.insert(0, MODEL_SRC)


def run(image_path):
    from app.features.screenings.quality import assess_image_quality
    from app.features.screenings.inference import run_inference, get_model
    from app.features.screenings.risk import map_grade_to_risk, get_poor_image_risk

    quality = assess_image_quality(image_path)
    if quality["status"] == "poor":
        risk = get_poor_image_risk()
        gc.collect()
        return {"status": "quality_failed", "quality": quality, "risk": risk}

    prediction = run_inference(image_path)
    risk = map_grade_to_risk(prediction["grade"])

    get_model.cache_clear()
    gc.collect()

    return {
        "status": "completed",
        "quality": quality,
        "prediction": prediction,
        "risk": risk,
    }


if __name__ == "__main__":
    image_path = sys.argv[1]
    try:
        result = run(image_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"status": "error", "error": str(e)}))
        sys.exit(1)
