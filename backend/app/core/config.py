import os
import sys
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "dr_screening")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
AUTH_SECRET = os.getenv("AUTH_SECRET", "")

# --- Fail-fast validation ---
_missing = []
if not AUTH_SECRET:
    _missing.append("AUTH_SECRET")
if _missing:
    print(f"FATAL: Required environment variable(s) missing: {', '.join(_missing)}", file=sys.stderr)
    sys.exit(1)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "uploads")
HEATMAP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "heatmaps")

GRADE_LABELS = {
    0: "No DR",
    1: "Mild DR",
    2: "Moderate DR",
    3: "Severe DR",
    4: "Proliferative DR",
}

GRADE_DESCRIPTIONS = {
    0: "No observable signs of diabetic retinopathy in this fundus image.",
    1: "Mild non-proliferative diabetic retinopathy with microaneurysms.",
    2: "Presence of microaneurysms and early retinal dot hemorrhages.",
    3: "Multiple intraretinal hemorrhages and cotton wool spots detected.",
    4: "Advanced proliferative diabetic retinopathy with neovascularization.",
}
