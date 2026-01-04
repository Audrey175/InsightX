import torch
from torch.utils.data import DataLoader
from dataset.segmentation_dataset import BRISCSegmentationDataset
from model.unet import UNet


def test_model(model, loader, criterion, device):
    model.eval()
    total_loss = 0.0

    with torch.no_grad():
        for images, masks in loader:
            images = images.to(device)
            masks = masks.to(device)

            preds = model(images)
            loss = criterion(preds, masks)
            total_loss += loss.item()

    return total_loss / len(loader)


def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"

    # -----------------------
    # Datasets
    # -----------------------
    train_ds = BRISCSegmentationDataset("data/segmentation_data/train")
    test_ds  = BRISCSegmentationDataset("data/segmentation_data/test")

    train_loader = DataLoader(
        train_ds,
        batch_size=8,
        shuffle=True,
        num_workers=2
    )

    test_loader = DataLoader(
        test_ds,
        batch_size=8,
        shuffle=False
    )

    # -----------------------
    # Model
    # -----------------------
    model = UNet(in_channels=1, num_classes=2).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
    criterion = torch.nn.CrossEntropyLoss()

    # -----------------------
    # Training
    # -----------------------
    for epoch in range(20):
        model.train()
        total_loss = 0.0

        for images, masks in train_loader:
            images = images.to(device)
            masks = masks.to(device)

            preds = model(images)
            loss = criterion(preds, masks)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        avg_train_loss = total_loss / len(train_loader)
        print(f"Epoch [{epoch+1}/20] - Train Loss: {avg_train_loss:.4f}")

    # -----------------------
    # Testing
    # -----------------------
    test_loss = test_model(model, test_loader, criterion, device)
    print(f"Test Loss: {test_loss:.4f}")

    torch.save(model.state_dict(), "unet_brisc.pth")
    print("Model saved as unet_brisc.pth")


if __name__ == "__main__":
    main()