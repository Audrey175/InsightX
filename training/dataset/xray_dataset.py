from torchvision import datasets, transforms

def get_xray_datasets(data_dir):
    transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.Grayscale(num_output_channels=3),  
    transforms.ToTensor()
    ])

    train_dataset = datasets.ImageFolder(
        root=f"{data_dir}/train",
        transform=transform
    )

    validate_dataset = datasets.ImageFolder(
        root=f"{data_dir}/val",
        transform=transform
    )

    test_ds = datasets.ImageFolder(
        root=f"{data_dir}/test",
        transform=transform
    )

    return train_dataset, validate_dataset, test_ds