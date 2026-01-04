import os
import zipfile
import tempfile
import numpy as np
import pydicom
from collections import defaultdict
import vtk
from vtk.util import numpy_support
import scipy.ndimage as ndimage


def is_valid_dicom_file(path: str) -> bool:
    name = os.path.basename(path)
    return (
        os.path.isfile(path)
        and name.lower().endswith(".dcm")
        and not name.startswith("._")
        and "__MACOSX" not in path
    )


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


def save_vtk_volume(volume: np.ndarray, spacing, output_path: str):
    """
    Save volume as VTK ImageData (.vti) for vtk.js GPU volume rendering
    """

    # --- Resample for web performance ---
    MAX_DEPTH = 256
    TARGET_XY = 128

    d, h, w = volume.shape
    volume = ndimage.zoom(
        volume,
        (MAX_DEPTH / d, TARGET_XY / h, TARGET_XY / w),
        order=1,
    )

    spacing = (
        spacing[0] * d / MAX_DEPTH,
        spacing[1] * h / TARGET_XY,
        spacing[2] * w / TARGET_XY,
    )

    depth, height, width = volume.shape

    # --- Build VTK ImageData ---
    image_data = vtk.vtkImageData()
    image_data.SetDimensions(width, height, depth)
    image_data.SetSpacing(spacing[2], spacing[1], spacing[0])
    image_data.SetOrigin(0, 0, 0)

    # ---- CRITICAL FIX: correct memory order for VTK ----
    volume_vtk = np.transpose(volume, (2, 1, 0))  # (x, y, z)
    volume_vtk = np.ascontiguousarray(volume_vtk, dtype=np.float32)

    vtk_array = numpy_support.numpy_to_vtk(
        volume_vtk.ravel(order="C"),
        deep=True,
        array_type=vtk.VTK_FLOAT,
    )
    vtk_array.SetName("Scalars")

    image_data.GetPointData().SetScalars(vtk_array)
    image_data.Modified()

    writer = vtk.vtkXMLImageDataWriter()
    writer.SetFileName(output_path)
    writer.SetInputData(image_data)
    writer.SetDataModeToAppended()
    writer.SetEncodeAppendedData(True)
    writer.SetCompressorTypeToNone()
    writer.Write()

    print(f"Saved VTI: {os.path.getsize(output_path) / 1024:.1f} KB")


def analyze_dicom_zip(zip_path: str):
    with tempfile.TemporaryDirectory() as tmpdir:
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(tmpdir)

        volume, spacing, series_uid, series_count = load_dicom_series(tmpdir)

        recon_dir = os.path.join("backend", "static", "reconstructions")
        os.makedirs(recon_dir, exist_ok=True)

        volume_path = os.path.join(recon_dir, "mri_volume.vti")
        save_vtk_volume(volume, spacing, volume_path)

        d, h, w = volume.shape

        return {
            "modality": "medical_volume",
            "input_type": "dicom_zip",
            "series_used": series_uid,
            "series_detected": series_count,
            "volume_shape": {
                "depth": int(d),
                "height": int(h),
                "width": int(w),
            },
            "voxel_spacing": spacing,
            "reconstruction_file": "/static/reconstructions/mri_volume.vti",
            "reconstruction": {
                "status": "success",
                "method": "VTK GPU Volume Rendering",
            },
            "statistics": {
                "mean_intensity": round(float(volume.mean()), 4),
                "max_intensity": round(float(volume.max()), 4),
            },
            "disclaimer": "This AI system is for research and decision support only.",
        }
