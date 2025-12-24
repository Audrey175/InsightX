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

    return pred.cpu().numpy()[0]


# -----------------------
# Post-processing
# -----------------------
def tumor_analysis(pred):
    core_pixels = int((pred == 1).sum())
    enhancing_pixels = int((pred == 2).sum())
    whole_pixels = core_pixels + enhancing_pixels

    coords = np.argwhere(pred > 0)
    location = None
    if len(coords) > 0:
        y, x = coords.mean(axis=0)
        location = {"x": float(x), "y": float(y)}

    risk = min(1.0, whole_pixels / 20000)

    return {
        "tumor_detected": whole_pixels > 100,
        "tumor_size_pixels": {
            "core": core_pixels,
            "enhancing": enhancing_pixels,
            "whole": whole_pixels
        },
        "tumor_location": location,
        "risk_score": round(risk, 2)
    }


# -----------------------
# MAIN SERVICE FUNCTION
# -----------------------
def analyze_mri(file_path):
    image = load_h5_image(file_path)
    mask = predict_mask(image)
    return tumor_analysis(mask)