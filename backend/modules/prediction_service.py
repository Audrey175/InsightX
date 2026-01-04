# import torch
# import numpy as np
# import h5py
# from backend.models.unet_model import UNet
# from backend.models.mri_disease_model import MRIDiseaseClassifier
# from PIL import Image
# from torchvision import transforms

# # -----------------------
# # Load model ONCE
# # -----------------------
# device = "cuda" if torch.cuda.is_available() else "cpu"

# # model = UNet(in_channels=4, num_classes=3)
# # model.load_state_dict(
# #     torch.load("backend/models/unet_brats.pth", map_location=device, weights_only=True)
# # )
# # model.to(device)
# # model.eval()

# seg_model = UNet(
#     in_channels=4,
#     num_classes=4  # background, edema, core, enhancing
# )

# seg_model.load_state_dict(
#     torch.load(
#         "backend/models/unet_brats.pth",
#         map_location=device,
#         weights_only=True
#     )
# )

# seg_model.to(device)
# seg_model.eval()

# cls_checkpoint = torch.load("backend/models/mri_disease_model.pth", map_location=device)

# cls_model = MRIDiseaseClassifier(num_classes=len(cls_checkpoint["classes"]))
# cls_model.load_state_dict(cls_checkpoint["model_state"])
# cls_model.to(device)
# cls_model.eval()

# CLASS_NAMES = cls_checkpoint["classes"]

# # =======================
# # IMAGE TRANSFORM
# # =======================
# image_transform = transforms.Compose([
#     transforms.Resize((224, 224)),
#     transforms.Grayscale(num_output_channels=3),
#     transforms.ToTensor(),
#     transforms.Normalize(
#         mean=[0.485, 0.456, 0.406],
#         std=[0.229, 0.224, 0.225]
#     )
# ])

# # cls_model = MRIDiseaseClassifier(num_classes=4)  # glioma, meningioma, notumor, pituitary

# # checkpoint = torch.load(
# #     "backend/models/mri_disease_model.pth",
# #     map_location=device
# # )

# # cls_model.load_state_dict(checkpoint["model_state"])
# # cls_model.to(device)
# # cls_model.eval()

# # CLASS_NAMES = checkpoint["classes"]

# # -----------------------
# # Load MRI (.h5)
# # -----------------------
# # def load_h5_image(file_path):
# #     with h5py.File(file_path, "r") as f:
# #         image = f["image"][:]  # (240,240,4)

# #     image = np.transpose(image, (2, 0, 1))   # (4,240,240)
# #     image = torch.tensor(image, dtype=torch.float32).unsqueeze(0)
# #     return image

# def load_h5_image(file_path):
#     """
#     Returns tensor of shape (1, 4, 240, 240)
#     """
#     with h5py.File(file_path, "r") as f:
#         image = f["image"][:]  # (240,240,4)

#     image = np.transpose(image, (2, 0, 1))  # (4,240,240)
#     image = torch.tensor(image, dtype=torch.float32)

#     # Normalize per volume (important)
#     image = (image - image.mean()) / (image.std() + 1e-6)

#     return image.unsqueeze(0)  # (1,4,H,W)


# # -----------------------
# # Predict mask
# # -----------------------
# # def predict_mask(image):
# #     image = image.to(device)

# #     with torch.no_grad():
# #         logits = model(image)                     # (1,3,H,W)
# #         probs = torch.softmax(logits, dim=1)      # softmax across classes
# #         pred = torch.argmax(probs, dim=1)         # (1,H,W)

# #     return pred.cpu().numpy()[0]

# def predict_segmentation(image):
#     """
#     Returns predicted mask (H, W)
#     """
#     image = image.to(device)

#     with torch.no_grad():
#         logits = seg_model(image)              # (1,4,H,W)
#         pred = torch.argmax(logits, dim=1)     # (1,H,W)

#     return pred.squeeze(0).cpu().numpy()


# # -----------------------
# # Post-processing
# # -----------------------
# def tumor_analysis(pred):
#     core_pixels = int((pred == 1).sum())
#     enhancing_pixels = int((pred == 2).sum())
#     whole_pixels = core_pixels + enhancing_pixels

#     coords = np.argwhere(pred > 0)
#     location = None
#     if len(coords) > 0:
#         y, x = coords.mean(axis=0)
#         location = {"x": float(x), "y": float(y)}

#     risk = min(1.0, whole_pixels / 20000)

#     return {
#         "tumor_detected": whole_pixels > 100,
#         "tumor_size_pixels": {
#             "core": core_pixels,
#             "enhancing": enhancing_pixels,
#             "whole": whole_pixels
#         },
#         "tumor_location": location,
#         "risk_score": round(risk, 2)
#     }

# # =======================
# # H5 PIPELINE
# # =======================
# def analyze_h5(file_path):
#     image = load_h5_image(file_path)
#     mask = predict_mask(image)
#     return tumor_analysis(mask)
# # # -----------------------
# # # MAIN SERVICE FUNCTION
# # # -----------------------
# # def analyze_mri(file_path):
# #     image = load_h5_image(file_path)
# #     mask = predict_mask(image)
# #     return tumor_analysis(mask)

# # -----------------------
# # Classification
# # -----------------------
# # def predict_class(image):
# #     image_gray = image.mean(dim=1, keepdim=True) 
# #     image_rgb = image_gray.repeat(1, 3, 1, 1)    
# #     image_rgb = image_rgb.to(device)

# #     with torch.no_grad():
# #         logits = cls_model(image_rgb)
# #         probs = torch.softmax(logits, dim=1)

# #         conf, idx = torch.max(probs, dim=1)

# #     return {
# #         "tumor_type": CLASS_NAMES[idx.item()],
# #         "confidence": round(conf.item(), 3),
# #         "probabilities": {
# #             CLASS_NAMES[i]: round(probs[0, i].item(), 3)
# #             for i in range(len(CLASS_NAMES))
# #         }
# #     }
# def analyze_image(file_path):
#     image = Image.open(file_path).convert("L")
#     image = image_transform(image).unsqueeze(0).to(device)

#     with torch.no_grad():
#         logits = cls_model(image)
#         probs = torch.softmax(logits, dim=1)
#         idx = torch.argmax(probs, dim=1).item()

#     return {
#         "predicted_disease": CLASS_NAMES[idx],
#         "confidence": round(probs[0, idx].item(), 4)
#     }

# # -----------------------
# # MAIN API FUNCTION
# # -----------------------
# def analyze_mri(file_path):
#     image = load_h5_image(file_path)

#     mask = predict_mask(image)
#     seg_result = tumor_analysis(mask)

#     if seg_result["tumor_detected"]:
#         cls_result = analyze_image(image)
#     else:
#         cls_result = {
#             "tumor_type": "none",
#             "confidence": 0.0
#         }

#     return {
#         "segmentation": seg_result,
#         "classification": cls_result
#     }

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
