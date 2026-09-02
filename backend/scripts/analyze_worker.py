#!/usr/bin/env python3
"""Standalone analyze worker — spawned as a subprocess by the main uvicorn
process. Loads torch/model/cv2, runs quality + inference + GradCAM, writes
JSON result to stdout. Main process stays under 512Mi."""
import os, sys, json, gc

os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"

BACKEND = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
sys.path.insert(0, BACKEND)

MODEL_SRC = os.path.join(BACKEND, "app", "model", "src")
sys.path.insert(0, MODEL_SRC)


def run(image_path, screening_id):
    from app.core.config import GRADE_LABELS
    from app.features.screenings.quality import assess_image_quality
    from app.features.screenings.inference import run_inference, get_model
    from app.features.screenings.gradcam import generate_gradcam
    from app.features.screenings.risk import map_grade_to_risk, get_poor_image_risk

    quality = assess_image_quality(image_path)
    if quality["status"] == "poor":
        risk = get_poor_image_risk()
        gc.collect()
        return {"status": "quality_failed", "quality": quality, "risk": risk}

    prediction = run_inference(image_path)
    heatmap_url = generate_gradcam(image_path, screening_id)
    risk = map_grade_to_risk(prediction["grade"])

    # Free heavy memory before returning
    get_model.cache_clear()
    gc.collect()

    return {
        "status": "completed",
        "quality": quality,
        "prediction": prediction,
        "explanation": {"heatmap_url": heatmap_url},
        "risk": risk,
    }


if __name__ == "__main__":
    image_path = sys.argv[1]
    screening_id = sys.argv[2]
    try:
        result = run(image_path, screening_id)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"status": "error", "error": str(e)}))
        sys.exit(1)
