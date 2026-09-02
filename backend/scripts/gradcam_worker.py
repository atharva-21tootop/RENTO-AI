#!/usr/bin/env python3
"""GradCAM subprocess — runs alone after inference worker. Writes heatmap
file + signed URL path to stdout. Only torch+model (reloaded), no overlap
with the inference worker's allocations."""
import os, sys, json, gc

os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"

BACKEND = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
sys.path.insert(0, BACKEND)
MODEL_SRC = os.path.join(BACKEND, "app", "model", "src")
sys.path.insert(0, MODEL_SRC)

import numpy as np


def save_overlay(image_path, cam, width, height, screening_id):
    """Recreate overlay + heatmap without cv2 (pure numpy/PIL)."""
    import torch
    from PIL import Image
    from app.core.config import HEATMAP_DIR
    from app.core.signed_url import sign_url

    os.makedirs(HEATMAP_DIR, exist_ok=True)

    # Resize CAM (1,1,H,W float) to (H,W) then to image size
    cam_np = cam[0, 0].cpu().numpy()  # (14,14)
    from PIL import Image as PILImage
    cam_img = PILImage.fromarray((cam_np * 255).astype(np.uint8)).resize((width, height), PILImage.BILINEAR)
    apply = np.array(cam_img).astype(np.float32) / 255.0
    # jet colormap approximating cv2.applyColorMap(COLORMAP_JET)
    # Use a simple R->Y->G->C->B jet gradient via numpy
    jet = _jet(np.array(cam_img))
    heat_rgb = jet

    original = Image.open(image_path).convert("RGB").resize((width, height))
    orig_np = np.array(original).astype(np.float32)

    overlay = np.clip(orig_np * 0.6 + heat_rgb * 0.4, 0, 255).astype(np.uint8)

    output_filename = f"{screening_id}.png"
    output_path = os.path.join(HEATMAP_DIR, output_filename)
    Image.fromarray(overlay).save(output_path)

    del cam_np, cam_img, apply, heat_rgb, original, orig_np, overlay
    gc.collect()

    return sign_url("heatmaps", output_filename)


def _jet(gray):
    """Blue->Cyan->Green->Yellow->Red (jet) colormap in RGB."""
    h, w = gray.shape
    v = gray.astype(np.float32) / 255.0
    r = np.clip(1.5 - abs(4 * v - 3), 0, 1)
    g = np.clip(1.5 - abs(4 * v - 2), 0, 1)
    b = np.clip(1.5 - abs(4 * v - 1), 0, 1)
    return np.stack([r, g, b], axis=2)


if __name__ == "__main__":
    image_path = sys.argv[1]
    screening_id = sys.argv[2]
    try:
        device = None
        import torch
        torch.set_num_threads(1)
        from inference import get_transform
        from gradcam import GradCAM
        from model import create_model
        from PIL import Image
        from app.features.screenings.inference import get_model

        image = Image.open(image_path).convert("RGB")
        width, height = image.size

        model = get_model()  # already cached/loaded torch model
        model.eval()

        transform = get_transform()
        input_tensor = transform(image).unsqueeze(0)
        if torch.cuda.is_available():
            input_tensor = input_tensor.cuda()

        with torch.no_grad():
            predicted = model(input_tensor).argmax(dim=1).item()

        input_tensor.requires_grad_()
        target_layer = model.features[-1][0]
        gc_inst = GradCAM(model=model, target_layer=target_layer)
        try:
            cam = gc_inst.generate(input_tensor, predicted)
        finally:
            gc_inst.close()

        heatmap_url = save_overlay(image_path, torch.from_numpy(cam).unsqueeze(0).float(), width, height, screening_id)
        print(json.dumps({"status": "ok", "heatmap_url": heatmap_url}))
    except Exception as e:
        print(json.dumps({"status": "error", "error": str(e)}))
        sys.exit(1)
