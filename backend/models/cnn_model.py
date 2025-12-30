import torch.nn as nn
from torchvision import models
<<<<<<< HEAD
from torchvision.models import ResNet18_Weights
=======

>>>>>>> main

class XRayCNN(nn.Module):
    def __init__(self):
        super().__init__()
<<<<<<< HEAD
        self.model = models.resnet18(
            weights=ResNet18_Weights.DEFAULT
        )
        self.model.fc = nn.Linear(512, 1)

    def forward(self, x):
        return self.model(x)
=======
        try:
            backbone = models.resnet18(weights=None)
        except TypeError:
            backbone = models.resnet18(pretrained=False)
        backbone.fc = nn.Linear(512, 1)
        self.model = backbone

    def forward(self, x):
        return self.model(x)
>>>>>>> main
