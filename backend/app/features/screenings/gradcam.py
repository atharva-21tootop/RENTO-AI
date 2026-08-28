import os

import torch
from PIL import Image

from app.core.config import HEATMAP_DIR
from app.core.signed_url import sign_url
from .inference import (
    _ensure_src_importable,
    get_model,
    _get_device,
)


def generate_gradcam(image_path: str, screening_id: str) -> str:
    _ensure_src_importable()
    from inference import get_transform
    from gradcam import GradCAM, create_heatmap, create_overlay

    device = _get_device()
    model = get_model().to(device)
    model.eval()

    image = Image.open(image_path).convert("RGB")
    width, height = image.size

    transform = get_transform()
    input_tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        predicted = model(input_tensor).argmax(dim=1).item()

    input_tensor.requires_grad_()
    target_layer = model.features[-1][0]
    gradcam = GradCAM(model=model, target_layer=target_layer)
    try:
        cam = gradcam.generate(input_tensor, predicted)
    finally:
        gradcam.close()

    heatmap = create_heatmap(cam, width, height)
    overlay = create_overlay(image, heatmap, alpha=0.30)

    os.makedirs(HEATMAP_DIR, exist_ok=True)
    output_filename = f"{screening_id}.png"
    output_path = os.path.join(HEATMAP_DIR, output_filename)
    Image.fromarray(overlay).save(output_path)

    return sign_url("heatmaps", output_filename)