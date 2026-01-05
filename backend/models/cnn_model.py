import torch.nn as nn
from torchvision import models

class XRayCNN(nn.Module):
    def __init__(self):
        super().__init__()
        try:
            backbone = models.resnet18(weights=None)
        except TypeError:
            backbone = models.resnet18(pretrained=False)
        backbone.fc = nn.Linear(512, 1)
        self.model = backbone

    def forward(self, x):
        return self.model(x)
