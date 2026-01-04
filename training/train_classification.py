import torch
from torch.utils.data import DataLoader
from dataset.classification_dataset import BRISCClassificationDataset, CLASS_NAMES
from model.classifier import MRIDiseaseClassifier


def test_model(model, loader, device):
    model.eval()
    correct = 0

    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)
            correct += (outputs.argmax(1) == labels).sum().item()

    return correct / len(loader.dataset)


def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"

    # -----------------------
    # Datasets
    # -----------------------
    train_ds = BRISCClassificationDataset("data/classification_data/train")
    test_ds  = BRISCClassificationDataset("data/classification_data/test")

    train_loader = DataLoader(train_ds, batch_size=16, shuffle=True)
    test_loader  = DataLoader(test_ds, batch_size=16, shuffle=False)

    # -----------------------
    # Model
    # -----------------------
    model = MRIDiseaseClassifier(num_classes=len(CLASS_NAMES)).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
    criterion = torch.nn.CrossEntropyLoss()

    # -----------------------
    # Training
    # -----------------------
    for epoch in range(15):
        model.train()

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)
            loss = criterion(outputs, labels)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

        print(f"Epoch [{epoch+1}/15] completed")

    # -----------------------
    # Testing
    # -----------------------
    test_acc = test_model(model, test_loader, device)
    print(f"Test Accuracy: {test_acc:.3f}")

    torch.save(
        {
            "model_state": model.state_dict(),
            "classes": CLASS_NAMES
        },
        "mri_disease_model.pth"
    )

    print("Model saved as mri_disease_model.pth")


if __name__ == "__main__":
    main()