import os
from torch.utils.data import Dataset
from PIL import Image
import torchvision.transforms as T

class BRISCSegmentationDataset(Dataset):
    def __init__(self, root_dir):
        self.img_dir = os.path.join(root_dir, "images")
        self.mask_dir = os.path.join(root_dir, "masks")

        if not os.path.exists(self.img_dir):
            raise FileNotFoundError(f"Missing images folder: {self.img_dir}")

        if not os.path.exists(self.mask_dir):
            raise FileNotFoundError(f"Missing masks folder: {self.mask_dir}")

        self.images = sorted([
            f for f in os.listdir(self.img_dir)
            if f.lower().endswith((".jpg", ".png"))
        ])

        assert len(self.images) > 0, "No images found in segmentation dataset"

        self.img_transform = T.Compose([
            T.Resize((256, 256)),
            T.ToTensor()
        ])

        self.mask_transform = T.Compose([
            T.Resize((256, 256), interpolation=Image.NEAREST),
            T.ToTensor()
        ])

    def __len__(self):
        return len(self.images)

    def _find_mask(self, img_name):
        """
        Match mask by image ID (BRISC naming)
        """
        # Example:
        # brisc2025_train_01592_me_co_t1.jpg → ID = 01592
        img_id = img_name.split("_")[2]

        for m in os.listdir(self.mask_dir):
            if img_id in m:
                return os.path.join(self.mask_dir, m)

        raise FileNotFoundError(f"No mask found for image ID {img_id}")

    def __getitem__(self, idx):
        img_name = self.images[idx]

        img_path = os.path.join(self.img_dir, img_name)
        mask_path = self._find_mask(img_name)

        image = Image.open(img_path).convert("L")
        mask = Image.open(mask_path)

        image = self.img_transform(image)
        mask = self.mask_transform(mask)

        # Binary segmentation: 0 = background, 1 = tumor
        mask = (mask > 0).long().squeeze(0)

        return image, mask