from __future__ import annotations

from pathlib import Path
from typing import Optional

import torch
from PIL import Image
from torchvision import transforms

from backend.models.cnn_model import XRayCNN

_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
_MODEL: Optional[XRayCNN] = None
_MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "xray_model.pth"
_MODEL_EXPECTED_REL = Path("backend") / "models" / "xray_model.pth"

_TRANSFORM = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.Grayscale(num_output_channels=3),
        transforms.ToTensor(),
    ]
)


def _load_model() -> XRayCNN:
    global _MODEL
    if _MODEL is not None:
        return _MODEL

    if not _MODEL_PATH.exists() or _MODEL_PATH.stat().st_size == 0:
        raise FileNotFoundError(
            "X-ray model weights not found. Place the file at "
            f"{_MODEL_EXPECTED_REL.as_posix()}."
        )

    model = XRayCNN()
    state = torch.load(str(_MODEL_PATH), map_location=_DEVICE)
    if isinstance(state, dict) and "state_dict" in state:
        state = state["state_dict"]
    model.load_state_dict(state)
    model.to(_DEVICE)
    model.eval()
    _MODEL = model
    return model


def analyze_xray(image_path: str) -> dict:
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"X-ray input file not found: {path}")

    model = _load_model()

    with Image.open(path) as image:
        image = image.convert("L")
        tensor = _TRANSFORM(image).unsqueeze(0).to(_DEVICE)

    with torch.no_grad():
        logits = model(tensor)
        prob_pneumonia = torch.sigmoid(logits).item()

    label = "PNEUMONIA" if prob_pneumonia >= 0.5 else "NORMAL"
    confidence = prob_pneumonia if label == "PNEUMONIA" else 1 - prob_pneumonia

    if label == "PNEUMONIA":
        if confidence >= 0.9:
            risk = "high"
        elif confidence >= 0.7:
            risk = "medium"
        else:
            risk = "low"
    else:
        risk = "low"

    return {
        "modality": "xray",
        "prediction_type": "classification",
        "prediction": {
            "label": label,
            "confidence": round(confidence, 3),
            "probabilities": {
                "NORMAL": round(1 - prob_pneumonia, 3),
                "PNEUMONIA": round(prob_pneumonia, 3),
            },
            "risk_level": risk,
        },
        "model_info": {
            "architecture": "CNN (ResNet-based)",
            "version": "xray-v1",
        },
        "disclaimer": "This AI system is for research and decision support only.",
    }
