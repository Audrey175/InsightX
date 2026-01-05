import torch.nn as nn
from torchvision import models
from torchvision.models import ResNet18_Weights

class XRayCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.model = models.resnet18(
            weights=ResNet18_Weights.DEFAULT
        )
        self.model.fc = nn.Linear(512, 1)

    def forward(self, x):
        return self.model(x)