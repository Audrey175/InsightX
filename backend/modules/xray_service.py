import torch
from PIL import Image
from torchvision import transforms
import os

from backend.models.cnn_model import XRayCNN

# -----------------------
# Load model ONCE
# -----------------------
device = torch.device('cpu')

model = XRayCNN()

state_dict = torch.load(
    "backend/models/xray_model.pth", 
    map_location=device, 
    weights_only=True
)

model.load_state_dict(state_dict)
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
        prob_pneumonia = torch.sigmoid(logits).item()

    label = "PNEUMONIA" if prob_pneumonia >= 0.5 else "NORMAL"
    confidence = prob_pneumonia if label == "PNEUMONIA" else 1 - prob_pneumonia

    # Risk logic
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
