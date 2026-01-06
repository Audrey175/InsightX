import torch.nn as nn
from torchvision.models import resnet18, ResNet18_Weights

class MRIDiseaseClassifier(nn.Module):
    def __init__(self, num_classes=4):
        super().__init__()
        self.model = resnet18(weights=ResNet18_Weights.DEFAULT)
        self.model.fc = nn.Linear(512, num_classes)

    def forward(self, x):
        return self.model(x)