<<<<<<< HEAD
import torch
import numpy as np
import h5py
from backend.models.unet_model import UNet

# -----------------------
# Load model ONCE
# -----------------------
device = "cuda" if torch.cuda.is_available() else "cpu"

model = UNet(in_channels=4, num_classes=3)
model.load_state_dict(
    torch.load("backend/models/unet_brats.pth", map_location=device, weights_only=True)
)
model.to(device)
model.eval()

# -----------------------
# Load MRI (.h5)
# -----------------------
def load_h5_image(file_path):
    with h5py.File(file_path, "r") as f:
        image = f["image"][:]  # (240,240,4)

    image = np.transpose(image, (2, 0, 1))   # (4,240,240)
    image = torch.tensor(image, dtype=torch.float32).unsqueeze(0)
    return image


# -----------------------
# Predict mask
# -----------------------
def predict_mask(image):
    image = image.to(device)

    with torch.no_grad():
        logits = model(image)                     # (1,3,H,W)
        probs = torch.softmax(logits, dim=1)      # softmax across classes
        pred = torch.argmax(probs, dim=1)         # (1,H,W)
=======
from __future__ import annotations

from pathlib import Path
from typing import Optional

import h5py
import numpy as np
import torch

from backend.models.unet_model import UNet

_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
_UNET_MODEL: Optional[UNet] = None
_UNET_WEIGHTS = Path(__file__).resolve().parents[1] / "models" / "unet_brats.pth"


def _load_unet_model() -> UNet:
    global _UNET_MODEL
    if _UNET_MODEL is not None:
        return _UNET_MODEL

    if not _UNET_WEIGHTS.exists() or _UNET_WEIGHTS.stat().st_size == 0:
        raise FileNotFoundError(
            f"UNet weights not found at {_UNET_WEIGHTS}. Place unet_brats.pth in backend/models."
        )

    model = UNet(in_channels=4, num_classes=3)
    state = torch.load(str(_UNET_WEIGHTS), map_location=_DEVICE)
    if isinstance(state, dict) and "state_dict" in state:
        state = state["state_dict"]
    model.load_state_dict(state)
    model.to(_DEVICE)
    model.eval()
    _UNET_MODEL = model
    return model


def load_h5_image(file_path: str) -> torch.Tensor:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"MRI input file not found: {path}")

    with h5py.File(path, "r") as f:
        if "image" not in f:
            raise ValueError("H5 file missing 'image' dataset.")
        image = f["image"][:]  # (240,240,4)

    image = np.transpose(image, (2, 0, 1))  # (4,240,240)
    return torch.tensor(image, dtype=torch.float32).unsqueeze(0)


def predict_mask(image: torch.Tensor) -> np.ndarray:
    model = _load_unet_model()
    image = image.to(_DEVICE)

    with torch.no_grad():
        logits = model(image)
        probs = torch.softmax(logits, dim=1)
        pred = torch.argmax(probs, dim=1)
>>>>>>> main

    return pred.cpu().numpy()[0]


<<<<<<< HEAD
# -----------------------
# Post-processing
# -----------------------
def tumor_analysis(pred):
=======
def tumor_analysis(pred: np.ndarray) -> dict:
>>>>>>> main
    core_pixels = int((pred == 1).sum())
    enhancing_pixels = int((pred == 2).sum())
    whole_pixels = core_pixels + enhancing_pixels

    coords = np.argwhere(pred > 0)
    location = None
    if len(coords) > 0:
        y, x = coords.mean(axis=0)
        location = {"x": float(x), "y": float(y)}

    risk = min(1.0, whole_pixels / 20000)

<<<<<<< HEAD
    return {
        "tumor_detected": whole_pixels > 100,
        "tumor_size_pixels": {
            "core": core_pixels,
            "enhancing": enhancing_pixels,
            "whole": whole_pixels
        },
        "tumor_location": location,
        "risk_score": round(risk, 2)
=======
    return {
        "tumor_detected": whole_pixels > 100,
        "tumor_size_pixels": {
            "core": core_pixels,
            "enhancing": enhancing_pixels,
            "whole": whole_pixels,
        },
        "tumor_location": location,
        "risk_score": round(risk, 2),
    }


def analyze_mri(file_path: str) -> dict:
    image = load_h5_image(file_path)
    mask = predict_mask(image)
    return tumor_analysis(mask)


def analyze_injury(reconstruction_path: str):
    return {
        "image_type": "MRI",
        "injury": "Hemorrhage",
        "injury_size": 3.4,
        "risk_score": 0.66,
>>>>>>> main
    }


# -----------------------
# MAIN SERVICE FUNCTION
# -----------------------
def analyze_mri(file_path):
    image = load_h5_image(file_path)
    mask = predict_mask(image)
    return tumor_analysis(mask)