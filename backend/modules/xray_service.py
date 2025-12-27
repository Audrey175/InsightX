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
        prob = torch.sigmoid(logits).item()

    prediction = "PNEUMONIA" if prob >= 0.5 else "NORMAL"

    return {
        "prediction": prediction,
        "confidence": round(prob if prediction == "PNEUMONIA" else 1 - prob, 3)
    }