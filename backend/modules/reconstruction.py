import nibabel as nib
import numpy as np
import os
import gzip
import base64
from io import BytesIO
# =========================================
# 1. 3D RECONSTRUCTION (demo placeholder)
# =========================================
def reconstruct_3d(filepath: str) -> str:
    """
    Fake reconstruction step:
    - Load original .nii/.nii.gz
    - Save a copy as _3d.nii
    This lets your backend pipeline run successfully.
    """

    img = nib.load(filepath)
    volume = img.get_fdata()

    # TODO: replace with real MONAI model later
    reconstructed = volume  

    output_path = filepath.replace(".nii", "_3d.nii").replace(".gz", "")
    nib.save(nib.Nifti1Image(reconstructed, img.affine), output_path)

    return output_path


# =========================================
# 2. INJURY / TUMOR "ANALYSIS" (demo)
# =========================================
def analyze_injury(filepath: str) -> dict:
    """
    Simple analysis:
    - Loads 3D MRI
    - Computes a fake "injury size" = voxels > mean
    - Classifies based on threshold
    """

    img = nib.load(filepath)
    vol = img.get_fdata()

    injury_size = float(np.sum(vol > vol.mean()) * 0.001)

    classification = "Tumor suspected" if injury_size > 10 else "Normal"
    risk_level = "High" if injury_size > 10 else "Low"

    return {
        "injury_size_mm": injury_size,
        "classification": classification,
        "risks_json": {"risk": risk_level}
    }
def reconstruct_volume(file_bytes: bytes):
    # Load NIfTI from bytes
    file_like = BytesIO(file_bytes)
    img = nib.load(file_like)
    data = img.get_fdata(dtype=np.float32)

    shape = data.shape

    # Flatten and compress
    flat = data.flatten()
    buf = BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb") as f:
        f.write(flat.tobytes())
    compressed_bytes = buf.getvalue()

    # Encode as base64
    volume_b64 = base64.b64encode(compressed_bytes).decode("utf-8")

    return shape, volume_b64
