import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image

MODEL_PATH = "backend/models/efficientnet_mri.pth"

CLASS_NAMES = ["Glioma", "Meningioma", "Notumor", "Pituitary"]  # CHANGE to your classes

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"



# Load Model
def load_model():
    model = models.efficientnet_b0(pretrained=False)
    model.classifier[1] = nn.Linear(1280, len(CLASS_NAMES))
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.eval()
    model.to(DEVICE)
    return model


model = load_model()



# Preprocessing
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

# Predict Function
def diagnose(img):
    # img is a PIL Image now
    img = img.convert("RGB")
    tensor = preprocess(img).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        outputs = model(tensor)
        probabilities = torch.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)

    return {
        "prediction": CLASS_NAMES[predicted.item()],
        "confidence": round(confidence.item() * 100, 2)
    }

def analyze_injury(reconstruction_path: str):
    return {
        "image_type": "MRI",
        "injury": "Hemorrhage",
        "injury_size": 3.4,
        "risk_score": 0.66
    }
