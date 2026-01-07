import os
import torch
import torch.nn as nn
import numpy as np
import scipy.ndimage as ndimage
import zipfile
import tempfile
from collections import defaultdict
import pydicom
import vtk
import h5py
from vtk.util import numpy_support
from backend.modules.heatmap import generate_grad_cam_heatmap

# ==========================================
# 1. 3D U-NET ARCHITECTURE (The AI Engine)
# ==========================================
class UNet3DReconstructor(nn.Module):
    def __init__(self):
        super(UNet3DReconstructor, self).__init__()
        
        def conv_block(in_c, out_c):
            return nn.Sequential(
                nn.Conv3d(in_c, out_c, kernel_size=3, padding=1),
                nn.ReLU(inplace=True),
                nn.Conv3d(out_c, out_c, kernel_size=3, padding=1),
                nn.ReLU(inplace=True)
            )

        self.enc1 = conv_block(1, 32)
        self.pool = nn.MaxPool3d(2)
        self.up = nn.Upsample(scale_factor=2, mode='trilinear', align_corners=True)
        # Final conv layer for Grad-CAM hooking
        self.final = nn.Conv3d(32, 1, kernel_size=1)

    def forward(self, x):
        s1 = self.enc1(x)
        d1 = self.up(self.pool(s1))
        return torch.sigmoid(self.final(s1))

# ==========================================
# 2. AI RECONSTRUCTION ENGINE
# ==========================================
class AIReconstructionEngine:
    def __init__(self):
        self.device = torch.device("cpu") # Optimized for Mac CPU
        self.model = UNet3DReconstructor().to(self.device)
        self.model.eval()

    def analyze_volume(self, volume, target_shape, heatmap_path):
        """
        Performs 3D Reconstruction and Grad-CAM in one pass.
        """
        # Downsample for performance to avoid timeouts
        d, h, w = volume.shape
        resampled = ndimage.zoom(volume, (128/d, 64/h, 64/w), order=1)
        
        # Prepare 5D Tensor: (Batch, Channel, Depth, Height, Width)
        tensor_in = torch.from_numpy(resampled).float().unsqueeze(0).unsqueeze(0).to(self.device)

        # Generate Grad-CAM Heatmap via the specialized module
        # This function hooks the model and saves the heatmap.png
        reconstructed_tensor = generate_grad_cam_heatmap(
            self.model, 
            tensor_in, 
            heatmap_path, 
            slice_axis=0
        )

        # Upsample the AI output back to the target VTK shape
        output_volume = reconstructed_tensor.squeeze().detach().cpu().numpy()
        final_volume = ndimage.zoom(
            output_volume, 
            (target_shape[0]/128, target_shape[1]/64, target_shape[2]/64), 
            order=3
        )
        return final_volume

# ==========================================
# CORE DICOM & VTK FUNCTIONS
# ==========================================

def is_valid_dicom_file(path: str) -> bool:
    name = os.path.basename(path)
    return (os.path.isfile(path) and name.lower().endswith(".dcm") and 
            not name.startswith("._") and "__MACOSX" not in path)


def load_dicom_series(dicom_root: str):
    dicom_files = []
    for root, _, files in os.walk(dicom_root):
        for f in files:
            full_path = os.path.join(root, f)
            if is_valid_dicom_file(full_path):
                dicom_files.append(full_path)

    if not dicom_files:
        raise ValueError("No DICOM files found.")

    series_map = defaultdict(list)
    for path in dicom_files:
        try:
            ds = pydicom.dcmread(path, stop_before_pixels=True, force=True)
            uid = ds.SeriesInstanceUID
            series_map[uid].append(path)
        except Exception:
            continue

    series_uid = max(series_map, key=lambda k: len(series_map[k]))
    series_files = series_map[series_uid]

    slice_data = []
    first_ds = None

    for path in series_files:
        try:
            ds = pydicom.dcmread(path, force=True)
            if not hasattr(ds, "pixel_array"):
                continue

            if first_ds is None:
                first_ds = ds

            z_pos = float(ds.ImagePositionPatient[2]) if "ImagePositionPatient" in ds else float(ds.InstanceNumber)
            slice_data.append((z_pos, ds.pixel_array.astype(np.float32)))
        except Exception:
            continue

    unique_slices = defaultdict(list)
    for z, pixels in slice_data:
        unique_slices[z].append(pixels)

    sorted_zs = sorted(unique_slices.keys())
    volume = np.stack([np.mean(unique_slices[z], axis=0) for z in sorted_zs], axis=0)

    pixel_spacing = getattr(first_ds, "PixelSpacing", [1.0, 1.0])
    dz = np.abs(np.diff(sorted_zs)).mean() if len(sorted_zs) > 1 else getattr(first_ds, "SliceThickness", 1.0)

    spacing = (float(dz), float(pixel_spacing[0]), float(pixel_spacing[1]))

    # Normalize to [0, 1]
    volume = (volume - volume.min()) / (volume.max() - volume.min() + 1e-8)

    return volume, spacing, series_uid, len(series_map)


def save_h5(volume, spacing, series_uid, out_path):
    with h5py.File(out_path, "w") as f:
        f.create_dataset(
            "volume",
            data=volume,
            compression="gzip",
            compression_opts=4,
        )
        f.attrs["spacing"] = spacing
        f.attrs["series_uid"] = series_uid.encode("utf-8")


def load_h5(h5_path):
    with h5py.File(h5_path, "r") as f:
        volume = f["volume"][:]
        spacing = tuple(f.attrs["spacing"])
        series_uid = f.attrs["series_uid"]
    return volume, spacing, series_uid


def save_vtk_volume(volume: np.ndarray, spacing, output_path: str):
    """
    Saves a PRE-RECONSTRUCTED volume as VTK ImageData.
    """
    depth, height, width = volume.shape

    # Build VTK ImageData
    image_data = vtk.vtkImageData()
    image_data.SetDimensions(width, height, depth)
    image_data.SetSpacing(spacing[2], spacing[1], spacing[0])
    image_data.SetOrigin(0, 0, 0)

    # Convert numpy to VTK (x, y, z)
    volume_vtk = np.transpose(volume, (2, 1, 0)) 
    volume_vtk = np.ascontiguousarray(volume_vtk, dtype=np.float32)

    vtk_array = numpy_support.numpy_to_vtk(
        volume_vtk.ravel(order="C"), 
        deep=True, 
        array_type=vtk.VTK_FLOAT
    )
    vtk_array.SetName("Scalars")
    image_data.GetPointData().SetScalars(vtk_array)

    writer = vtk.vtkXMLImageDataWriter()
    writer.SetFileName(output_path)
    writer.SetInputData(image_data)
    writer.Write()

    print(f"Saved VTI: {os.path.getsize(output_path) / 1024:.1f} KB")


def h5_to_vti(h5_path: str, vti_path: str):
    with h5py.File(h5_path, "r") as f:
        volume = f["volume"][:]
        spacing = tuple(f.attrs["spacing"])

    save_vtk_volume(volume, spacing, vti_path)


def analyze_dicom_zip(zip_path: str):
    """
    Main entry point: Extracts ZIP, loads DICOM, preserves raw H5 data,
    performs AI U-Net reconstruction, and generates Grad-CAM heatmap.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        # 1. Extract the uploaded files
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(tmpdir)

        # 2. Load the raw DICOM series into a 3D Volume
        volume, spacing, series_uid, series_count = load_dicom_series(tmpdir)

        # 3. Setup output directories and define filenames
        recon_dir = os.path.join("backend", "static", "reconstructions")
        os.makedirs(recon_dir, exist_ok=True)

        # --- ENSURE THESE FILENAMES ARE DEFINED HERE ---
        h5_filename = f"{series_uid}.h5"
        vti_filename = f"{series_uid}.vti"
        heatmap_filename = f"{series_uid}_heatmap.png"

        h5_path = os.path.join(recon_dir, h5_filename)
        vti_path = os.path.join(recon_dir, vti_filename)
        heatmap_path = os.path.join(recon_dir, heatmap_filename)

        # 4. Save Raw HDF5 for your teammate
        save_h5(volume, spacing, series_uid, h5_path)

        # 5. Execute AI Reconstruction Engine (3D U-Net + Grad-CAM)
        engine = AIReconstructionEngine()
        TARGET_SHAPE = (256, 128, 128)
        ai_volume = engine.analyze_volume(
            volume, 
            target_shape=TARGET_SHAPE, 
            heatmap_path=heatmap_path
        )

        # 6. Calculate new spacing and save VTK (.vti)
        d, h, w = volume.shape
        ai_spacing = (
            spacing[0] * d / TARGET_SHAPE[0],
            spacing[1] * h / TARGET_SHAPE[1],
            spacing[2] * w / TARGET_SHAPE[2]
        )
        save_vtk_volume(ai_volume, ai_spacing, vti_path)

        # 7. Return metadata to the frontend
        return {
            "modality": "medical_volume",
            "input_type": "dicom_zip",
            "reconstruction_engine": "3D U-Net",
            "heatmap_type": "Grad-CAM",
            "series_uid": series_uid,
            "series_detected": series_count,
            "volume_shape": {
                "depth": int(ai_volume.shape[0]),
                "height": int(ai_volume.shape[1]),
                "width": int(ai_volume.shape[2]),
            },
            "voxel_spacing": ai_spacing,
            "canonical_volume_file": f"/static/reconstructions/{h5_filename}",
            "reconstruction_file": f"/static/reconstructions/{vti_filename}",
            "heatmap_slice": f"/static/reconstructions/{heatmap_filename}",
            "statistics": {
                "mean_intensity": round(float(ai_volume.mean()), 4),
                "max_intensity": round(float(ai_volume.max()), 4),
            },
            "disclaimer": "AI-generated reconstruction for research support only."
        }