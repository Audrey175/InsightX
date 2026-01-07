import numpy as np
import matplotlib.pyplot as plt
import os
import torch
import torch.nn.functional as F

def generate_grad_cam_heatmap(
    model: torch.nn.Module,
    input_tensor: torch.Tensor,
    output_path: str,
    slice_axis: int = 0
):
    """
    model: Your 3D U-Net model
    input_tensor: The 5D tensor (1, 1, D, H, W) used for reconstruction
    """
    model.eval()
    
    # 1. Hook into the last convolutional layer
    features = []
    def hook_feature(module, input, output):
        features.append(output)

    handle = model.final.register_forward_hook(hook_feature)

    # 2. Forward pass to get features
    output = model(input_tensor)
    handle.remove()

    # 3. Calculate heatmap from feature maps
    feature_map = features[0].detach().cpu().squeeze() 
    if len(feature_map.shape) == 4:
        heatmap_3d = torch.mean(feature_map, dim=0).numpy()
    else:
        heatmap_3d = feature_map.numpy()

    # 4. Normalize the heatmap
    heatmap_3d = np.maximum(heatmap_3d, 0)
    heatmap_3d /= (np.max(heatmap_3d) + 1e-8)

    # 5. Extract the slice for visualization 
    if len(heatmap_3d.shape) == 3:
        slice_index = heatmap_3d.shape[slice_axis] // 2
        if slice_axis == 0:
            heatmap_2d = heatmap_3d[slice_index, :, :]
        elif slice_axis == 1:
            heatmap_2d = heatmap_3d[:, slice_index, :]
        else:
            heatmap_2d = heatmap_3d[:, :, slice_index]
    else:
        # Fallback if the array is already 2D
        heatmap_2d = heatmap_3d
        
    # 6. Plot using the "Jet" or "Viridis" colormap (Standard for Grad-CAM)
    plt.figure(figsize=(5, 5))
    plt.imshow(heatmap_2d, cmap="jet", interpolation='bilinear')
    plt.axis("off")
    plt.tight_layout(pad=0)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path, dpi=150, bbox_inches="tight", pad_inches=0)
    plt.close()
    
    return output 