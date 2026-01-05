import torch
import numpy as np
from PIL import Image
import torchvision.transforms as T

from backend.models.unet import UNet
from backend.models.classifier import MRIDiseaseClassifier
from typing import List, Dict

# =====================
# CONFIG
# =====================
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
IMAGE_SIZE = 256

SEG_MODEL_PATH = "backend/models/unet_brisc.pth"
CLS_MODEL_PATH = "backend/models/mri_disease_model.pth"

# =====================
# LOAD MODELS ONCE ✅
# =====================
seg_model = UNet(in_channels=1, num_classes=2)
seg_model.load_state_dict(
    torch.load(SEG_MODEL_PATH, map_location=DEVICE, weights_only=True)
)
seg_model.to(DEVICE)
seg_model.eval()

cls_ckpt = torch.load(
    CLS_MODEL_PATH,
    map_location=DEVICE,
    weights_only=True
)
CLASS_NAMES = cls_ckpt["classes"]

cls_model = MRIDiseaseClassifier(num_classes=len(CLASS_NAMES))
cls_model.load_state_dict(cls_ckpt["model_state"])
cls_model.to(DEVICE)
cls_model.eval()

# =====================
# TRANSFORMS
# =====================
seg_transform = T.Compose([
    T.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    T.ToTensor()
])

cls_transform = T.Compose([
    T.Resize((224, 224)),
    T.Grayscale(num_output_channels=3),
    T.ToTensor(),
    T.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# =====================
# SEGMENTATION
# =====================
def segment_tumor(image_tensor):
    with torch.no_grad():
        logits = seg_model(image_tensor)
        pred = torch.argmax(logits, dim=1)
    return pred[0].cpu().numpy()

# =====================
# ANALYZE MASK
# =====================
def analyze_mask(mask):
    tumor_pixels = int((mask == 1).sum())

    if tumor_pixels < 100:
        return {
            "tumor_detected": False,
            "tumor_size_pixels": 0,
            "tumor_location": None
        }

    coords = np.column_stack(np.where(mask == 1))
    y, x = coords.mean(axis=0)

    return {
        "tumor_detected": True,
        "tumor_size_pixels": tumor_pixels,
        "tumor_location": {
            "x": float(x),
            "y": float(y)
        }
    }

# =====================
# CLASSIFICATION
# =====================
def classify_disease(image_tensor):
    with torch.no_grad():
        logits = cls_model(image_tensor)
        probs = torch.softmax(logits, dim=1)[0]

    idx = probs.argmax().item()

    return {
        "tumor_type": CLASS_NAMES[idx],
        "confidence": round(probs[idx].item(), 4),
        "probabilities": {
            CLASS_NAMES[i]: round(probs[i].item(), 4)
            for i in range(len(CLASS_NAMES))
        }
    }

# =====================
# RISK ANALYSIS
# =====================
TUMOR_RISK_MAP: Dict[str, Dict] = {
    "glioma": {
        "risks": [
            "Rapid growth (especially high-grade gliomas)",
            "Seizures",
            "Speech and cognitive impairment",
            "Motor weakness or paralysis",
            "Infiltrates surrounding brain tissue, making surgery difficult",
            "High recurrence rate"
        ]
    },
    "meningioma": {
        "risks": [
            "Increased intracranial pressure",
            "Vision problems (if near optic nerve)",
            "Speech or memory issues",
            "Seizures (less common than glioma)",
            "Can compress nearby brain structures",
            "Possible recurrence after surgery"
        ]
    },
    "pituitary": {
        "risks": [
            "Vision loss (optic chiasm compression)",
            "Hormonal imbalance",
            "Fatigue and metabolic disorders",
            "Headaches",
            "Endocrine dysfunction (thyroid, cortisol, growth hormone)"
        ]
    },
    "notumor": {
        "risks": [
            "No tumor detected",
            "Normal brain MRI appearance",
            "Continue routine monitoring if symptoms persist"
        ]
    }
}


def get_tumor_risk(tumor_type: str) -> Dict:
    """
    Returns medical risk information based on tumor type.
    """
    tumor_type = tumor_type.lower()

    return TUMOR_RISK_MAP.get(
        tumor_type,
        {
            "risk_score": 0.0,
            "risks": ["⚠️ Unknown tumor type – risk assessment unavailable"]
        }
    )
# =====================
# MAIN ENTRY
# =====================
def analyze_mri(image_path: str):
    image = Image.open(image_path).convert("L")

    # Classification
    cls_input = cls_transform(image).unsqueeze(0).to(DEVICE)
    cls_result = classify_disease(cls_input)

    # Risk analysis
    risk_info = get_tumor_risk(cls_result["tumor_type"])

    # Segmentation
    if cls_result["tumor_type"] == "notumor":
        seg_result = {
            "tumor_detected": False,
            "tumor_size_pixels": 0,
            "tumor_location": None
        }
    else:
        seg_input = seg_transform(image).unsqueeze(0).to(DEVICE)
        mask = segment_tumor(seg_input)
        seg_result = analyze_mask(mask)

    return {
        "segmentation": seg_result,
        "classification": cls_result,
        "risk_analysis": risk_info
    }
