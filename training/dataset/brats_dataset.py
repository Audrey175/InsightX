import os
import h5py
import torch
from torch.utils.data import Dataset

class BraTSDataset(Dataset):
    def __init__(self, h5_dir):
        self.files = [
            os.path.join(h5_dir, f)
            for f in os.listdir(h5_dir)
            if f.endswith(".h5")
        ]

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        with h5py.File(self.files[idx], 'r') as f:
            image = f['image'][:]   # (240,240,4)
            mask = f['mask'][:]     # (240,240,3)

        image = torch.tensor(image, dtype=torch.float32).permute(2,0,1)
        mask  = torch.tensor(mask,  dtype=torch.float32).permute(2,0,1)

        return image, mask