import numpy as np
import matplotlib.pyplot as plt
import os

def generate_heatmap_slice(
    volume: np.ndarray,
    output_path: str,
    slice_axis: int = 0
):
    """
    volume: 3D numpy array (D, H, W)
    output_path: absolute file path to save PNG
    """

    # Choose middle slice
    slice_index = volume.shape[slice_axis] // 2

    if slice_axis == 0:
        slice_2d = volume[slice_index, :, :]
    elif slice_axis == 1:
        slice_2d = volume[:, slice_index, :]
    else:
        slice_2d = volume[:, :, slice_index]

    # Normalize
    slice_2d = slice_2d.astype(np.float32)
    slice_2d -= slice_2d.min()
    slice_2d /= (slice_2d.max() + 1e-8)

    # Plot heatmap
    plt.figure(figsize=(5, 5))
    plt.imshow(slice_2d, cmap="hot")
    plt.axis("off")
    plt.tight_layout(pad=0)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path, dpi=150, bbox_inches="tight", pad_inches=0)
    plt.close()
    