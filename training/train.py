import torch
from torch.utils.data import DataLoader

from dataset.brats_dataset import BraTSDataset
from model.unet_model import UNet

# Loss function 
def dice_loss(pred, target, smooth=1e-6):
    pred = torch.sigmoid(pred)
    intersection = (pred * target).sum(dim=(2,3))
    union = pred.sum(dim=(2,3)) + target.sum(dim=(2,3))
    dice = (2. * intersection + smooth) / (union + smooth)
    return 1 - dice.mean()

def main():
    # Dataset & DataLoader
    dataset = BraTSDataset("brats")

    loader = DataLoader(
        dataset,
        batch_size=8,
        shuffle=True,
        num_workers=4,
        pin_memory=True
    )

    # Model (Section 3)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print("Using device:", device)

    if device == "cuda":
        print("GPU:", torch.cuda.get_device_name(0))

    model = UNet(in_channels=4, num_classes=3).to(device)

    optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)


    # Training loop
    epochs = 30

    for epoch in range(epochs):
        model.train()
        total_loss = 0

        for i, (images, masks) in enumerate(loader):
            if i % 100 == 0:
                print(f"Epoch {epoch+1}, Batch {i}/{len(loader)}")
            # Normalize MRI per sample
            images = (images - images.mean()) / (images.std() + 1e-5)

            images = images.to(device, non_blocking=True)
            masks  = masks.to(device, non_blocking=True)

            preds = model(images)
            loss = dice_loss(preds, masks)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        avg_loss = total_loss / len(loader)
        print(f"Epoch [{epoch+1}/{epochs}] - Loss: {avg_loss:.4f}")

    torch.save(model.state_dict(), "unet_brats.pth")
    print("Model saved!")
if __name__ == "__main__":
    main()