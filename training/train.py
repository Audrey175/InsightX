import torch
from torch.utils.data import DataLoader
from dataset.xray_dataset import get_xray_datasets
from model.cnn_model import XRayCNN

def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    DATA_DIR = "data"

    train_ds, val_ds, test_ds = get_xray_datasets(DATA_DIR)

    print("Using device:", device)
    print("Train samples:", len(train_ds))
    print("Val samples:", len(val_ds))
    print("Test samples:", len(test_ds))
    print("Classes:", train_ds.classes)
    
    train_loader = DataLoader(
        train_ds,
        batch_size=16,
        shuffle=True,
        num_workers=0,     
        pin_memory=(device == "cuda")
    )

    val_loader = DataLoader(
        val_ds,
        batch_size=16,
        shuffle=False,
        num_workers=0,
        pin_memory=(device == "cuda")
    )

    model = XRayCNN().to(device)

    criterion = torch.nn.BCEWithLogitsLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)

    epochs = 10

    for epoch in range(epochs):
        model.train()
        train_loss = 0.0

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.float().unsqueeze(1).to(device)

            preds = model(images)
            loss = criterion(preds, labels)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            train_loss += loss.item()

        train_loss /= len(train_loader)

        model.eval()
        val_loss = 0.0
        correct = 0
        total = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device)
                labels = labels.float().unsqueeze(1).to(device)

                preds = model(images)
                loss = criterion(preds, labels)
                val_loss += loss.item()

                probs = torch.sigmoid(preds)
                predicted = (probs > 0.5).float()

                correct += (predicted == labels).sum().item()
                total += labels.numel()

        val_loss /= len(val_loader)
        val_acc = correct / total * 100

        print(
            f"Epoch {epoch+1}/{epochs} | "
            f"Train Loss: {train_loss:.4f} | "
            f"Val Loss: {val_loss:.4f} | "
            f"Val Acc: {val_acc:.2f}%"
        )

    torch.save(model.state_dict(), "xray_model.pth")
    print("✅ X-ray model saved as xray_model.pth")

if __name__ == "__main__":
    main()