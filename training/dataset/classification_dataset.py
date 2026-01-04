import os
from PIL import Image
import torch
from torch.utils.data import Dataset
import torchvision.transforms as T

CLASS_NAMES = ["glioma", "meningioma", "pituitary", "notumor"]

class BRISCClassificationDataset(Dataset):
    def __init__(self, image_dir):
        self.samples = []
        self.transform = T.Compose([
            T.Resize((224, 224)),
            T.Grayscale(num_output_channels=3),
            T.ToTensor(),
            T.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

        for label, name in enumerate(CLASS_NAMES):
            folder = os.path.join(image_dir, name)
            for img in os.listdir(folder):
                self.samples.append((os.path.join(folder, img), label))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        image = Image.open(path).convert("L")
        image = self.transform(image)
        return image, label