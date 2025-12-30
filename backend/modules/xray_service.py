<<<<<<< HEAD
import torch
from PIL import Image
from torchvision import transforms
import os

from backend.models.cnn_model import XRayCNN

# -----------------------
# Load model ONCE
# -----------------------
device = "cuda" if torch.cuda.is_available() else "cpu"

model = XRayCNN()
model.load_state_dict(
    torch.load("backend/models/xray_model.pth", map_location=device)
)
model.to(device)
model.eval()

# -----------------------
# Image preprocessing
# -----------------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.Grayscale(num_output_channels=3),  # IMPORTANT
    transforms.ToTensor()
])

# -----------------------
# Prediction function
# -----------------------
def analyze_xray(image_path: str):
    image = Image.open(image_path).convert("L")
    image = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(image)
=======
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
            f"X-ray model weights not found at {_MODEL_PATH}. Place xray_model.pth in backend/models."
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
>>>>>>> main
        prob_pneumonia = torch.sigmoid(logits).item()

    label = "PNEUMONIA" if prob_pneumonia >= 0.5 else "NORMAL"
    confidence = prob_pneumonia if label == "PNEUMONIA" else 1 - prob_pneumonia

<<<<<<< HEAD
    # Risk logic
=======
>>>>>>> main
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
<<<<<<< HEAD
                "PNEUMONIA": round(prob_pneumonia, 3)
            },
            "risk_level": risk
        },
        "model_info": {
            "architecture": "CNN (ResNet-based)",
            "version": "xray-v1"
        },
        "disclaimer": "This AI system is for research and decision support only."
    }
=======
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
>>>>>>> main
