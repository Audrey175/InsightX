# import torch
# from torch.utils.data import DataLoader
# from dataset.xray_dataset import get_xray_datasets
# from model.cnn_model import XRayCNN

# def main():
#     device = "cuda" if torch.cuda.is_available() else "cpu"
    
#     DATA_DIR = "data"

#     train_ds, val_ds, test_ds = get_xray_datasets(DATA_DIR)

#     print("Using device:", device)
#     print("Train samples:", len(train_ds))
#     print("Val samples:", len(val_ds))
#     print("Test samples:", len(test_ds))
#     print("Classes:", train_ds.classes)
    
#     train_loader = DataLoader(
#         train_ds,
#         batch_size=16,
#         shuffle=True,
#         num_workers=0,     
#         pin_memory=(device == "cuda")
#     )

#     val_loader = DataLoader(
#         val_ds,
#         batch_size=16,
#         shuffle=False,
#         num_workers=0,
#         pin_memory=(device == "cuda")
#     )

#     model = XRayCNN().to(device)

#     criterion = torch.nn.BCEWithLogitsLoss()
#     optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)

#     epochs = 10

#     for epoch in range(epochs):
#         model.train()
#         train_loss = 0.0

#         for images, labels in train_loader:
#             images = images.to(device)
#             labels = labels.float().unsqueeze(1).to(device)

#             preds = model(images)
#             loss = criterion(preds, labels)

#             optimizer.zero_grad()
#             loss.backward()
#             optimizer.step()

#             train_loss += loss.item()

#         train_loss /= len(train_loader)

#         model.eval()
#         val_loss = 0.0
#         correct = 0
#         total = 0

#         with torch.no_grad():
#             for images, labels in val_loader:
#                 images = images.to(device)
#                 labels = labels.float().unsqueeze(1).to(device)

#                 preds = model(images)
#                 loss = criterion(preds, labels)
#                 val_loss += loss.item()

#                 probs = torch.sigmoid(preds)
#                 predicted = (probs > 0.5).float()

#                 correct += (predicted == labels).sum().item()
#                 total += labels.numel()

#         val_loss /= len(val_loader)
#         val_acc = correct / total * 100

#         print(
#             f"Epoch {epoch+1}/{epochs} | "
#             f"Train Loss: {train_loss:.4f} | "
#             f"Val Loss: {val_loss:.4f} | "
#             f"Val Acc: {val_acc:.2f}%"
#         )

#     torch.save(model.state_dict(), "xray_model.pth")
#     print("✅ X-ray model saved as xray_model.pth")

# if __name__ == "__main__":
#     main()
# import torch
# import torch.nn as nn
# import torch.optim as optim
# from torchvision import datasets, transforms
# from torch.utils.data import DataLoader
# from model.mri_disease_model import MRIDiseaseClassifier
# import os

# DATASET_DIR = "data"
# BATCH_SIZE = 16
# EPOCHS = 10
# LR = 1e-4
# MODEL_SAVE_PATH = "mri_disease_model.pth"

# device = "cuda" if torch.cuda.is_available() else "cpu"

# transform = transforms.Compose([
#     transforms.Resize((224, 224)),
#     transforms.Grayscale(num_output_channels=3), 
#     transforms.ToTensor(),
#     transforms.Normalize(
#         mean=[0.485, 0.456, 0.406],
#         std=[0.229, 0.224, 0.225]
#     )
# ])

# train_dataset = datasets.ImageFolder(
#     root=os.path.join(DATASET_DIR, "train"),
#     transform=transform
# )

# test_dataset = datasets.ImageFolder(
#     root=os.path.join(DATASET_DIR, "test"),
#     transform=transform
# )

# class_names = train_dataset.classes
# num_classes = len(class_names)

# print("Classes:", class_names)

# train_loader = DataLoader(
#     train_dataset,
#     batch_size=BATCH_SIZE,
#     shuffle=True
# )

# test_loader = DataLoader(
#     test_dataset,
#     batch_size=BATCH_SIZE,
#     shuffle=False
# )

# model = MRIDiseaseClassifier(num_classes=num_classes)
# model.to(device)

# criterion = nn.CrossEntropyLoss()
# optimizer = optim.Adam(model.parameters(), lr=LR)
# for epoch in range(EPOCHS):
#     model.train()
#     running_loss = 0.0

#     for images, labels in train_loader:
#         images = images.to(device)
#         labels = labels.to(device)

#         optimizer.zero_grad()
#         outputs = model(images)
#         loss = criterion(outputs, labels)

#         loss.backward()
#         optimizer.step()

#         running_loss += loss.item()

#     avg_loss = running_loss / len(train_loader)
#     print(f"Epoch [{epoch+1}/{EPOCHS}], Loss: {avg_loss:.4f}")

# model.eval()
# correct = 0
# total = 0

# with torch.no_grad():
#     for images, labels in test_loader:
#         images = images.to(device)
#         labels = labels.to(device)

#         outputs = model(images)
#         _, predicted = torch.max(outputs, 1)

#         total += labels.size(0)
#         correct += (predicted == labels).sum().item()

# accuracy = 100 * correct / total
# print(f"Test Accuracy: {accuracy:.2f}%")

# torch.save({
#     "model_state": model.state_dict(),
#     "classes": class_names
# }, MODEL_SAVE_PATH)

# print("Model saved to", MODEL_SAVE_PATH)
import torch
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
import torchvision.transforms as T

from model.unet import UNet

# =====================
# CONFIG
# =====================
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
IMAGE_SIZE = 256
MODEL_PATH = "model/unet_brisc.pth"

# =====================
# LOAD MODEL
# =====================
model = UNet(in_channels=1, num_classes=2)
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE, weights_only=True))
model.to(DEVICE)
model.eval()

# =====================
# TRANSFORM
# =====================
transform = T.Compose([
    T.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    T.ToTensor()
])

# =====================
# SEGMENT
# =====================
def segment(image_path):
    image = Image.open(image_path).convert("L")
    input_tensor = transform(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        logits = model(input_tensor)
        mask = torch.argmax(logits, dim=1)[0].cpu().numpy()

    return np.array(image.resize((IMAGE_SIZE, IMAGE_SIZE))), mask

# =====================
# VISUALIZE
# =====================
def visualize(image, mask):
    coords = np.column_stack(np.where(mask == 1))

    plt.figure(figsize=(6, 6))
    plt.imshow(image, cmap="gray")
    plt.imshow(mask, alpha=0.4, cmap="Reds")

    if len(coords) > 0:
        y, x = coords.mean(axis=0)
        plt.scatter(x, y, c="blue", s=40, label="Centroid")

    plt.title("MRI + Tumor Mask + Location")
    plt.axis("off")
    plt.legend()
    plt.show()

# =====================
# RUN
# =====================
if __name__ == "__main__":
    img_path = "data/classification_data/test/meningioma/brisc2025_test_00262_me_ax_t1.jpg"
    image, mask = segment(img_path)
    visualize(image, mask)