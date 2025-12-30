import os
import zipfile
import tempfile
import numpy as np
import pydicom
from collections import defaultdict
from skimage import measure
import trimesh

def is_valid_dicom_file(path: str) -> bool:
    name = os.path.basename(path)
    return (
        os.path.isfile(path)
        and name.lower().endswith(".dcm")
        and not name.startswith("._")
        and "__MACOSX" not in path
    )

def group_by_series(dicom_files):
    series_map = defaultdict(list)
    for path in dicom_files:
        try:
            ds = pydicom.dcmread(path, stop_before_pixels=True, force=True)
            series_uid = ds.get("SeriesInstanceUID", None)
            if series_uid:
                series_map[series_uid].append(path)
        except Exception:
            continue
    if not series_map:
        raise ValueError("No valid DICOM series found.")
    return series_map

def load_dicom_series(dicom_root: str):
    dicom_files = [
        os.path.join(root, f)
        for root, _, files in os.walk(dicom_root)
        for f in files
        if is_valid_dicom_file(os.path.join(root, f))
    ]
    if not dicom_files:
        raise ValueError("No DICOM files found.")

    series_map = group_by_series(dicom_files)
    series_uid, series_files = max(series_map.items(), key=lambda x: len(x[1]))

    slices = []
    positions = []

    for path in series_files:
        try:
            ds = pydicom.dcmread(path, force=True)
            if not hasattr(ds, "pixel_array"):
                continue
            slices.append(ds.pixel_array.astype(np.float32))
            # Prefer ImagePositionPatient for Z-order
            if "ImagePositionPatient" in ds:
                positions.append(ds.ImagePositionPatient[2])
            else:
                positions.append(ds.get("InstanceNumber", 0))
        except Exception:
            continue

    if not slices:
        raise ValueError("No readable pixel data in selected DICOM series.")

    # Sort slices by spatial position
    sorted_pairs = sorted(zip(positions, slices), key=lambda x: x[0])
    volume = np.stack([s for _, s in sorted_pairs], axis=0)

    # Estimate spacing
    try:
        dz = abs(sorted_pairs[1][0] - sorted_pairs[0][0])
    except Exception:
        dz = 1.0
    spacing = (dz, 1.0, 1.0)

    # MONAI-style normalization
    volume = (volume - volume.min()) / (volume.max() - volume.min() + 1e-8)

    return volume, spacing, series_uid, len(series_map)

def save_surface_mesh(volume: np.ndarray, output_path: str):
    """
    Generate a 3D surface mesh using marching cubes and save as .ply
    """
    verts, faces, normals, values = measure.marching_cubes(volume, level=0.5)
    mesh = trimesh.Trimesh(vertices=verts, faces=faces, vertex_normals=normals)
    mesh.export(output_path)  # e.g., .ply or .obj

def analyze_dicom_zip(zip_path: str):
    with tempfile.TemporaryDirectory() as tmpdir:
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(tmpdir)

        volume, spacing, series_uid, series_count = load_dicom_series(tmpdir)

        recon_dir = os.path.join("backend", "static", "reconstructions")
        os.makedirs(recon_dir, exist_ok=True)

        # Save 3D surface mesh
        mesh_name = "mri_surface.ply"
        mesh_path = os.path.join(recon_dir, mesh_name)
        save_surface_mesh(volume, mesh_path)

        d, h, w = volume.shape

        return {
            "modality": "medical_volume",
            "input_type": "dicom_zip",
            "series_used": series_uid,
            "series_detected": series_count,
            "volume_shape": {"depth": d, "height": h, "width": w},
            "voxel_spacing": spacing,
            "reconstruction_image": f"/static/reconstructions/{mesh_name}",
            "reconstruction": {"status": "success", "method": "Surface mesh (marching cubes)"},
            "statistics": {
                "mean_intensity": round(float(np.mean(volume)), 4),
                "max_intensity": round(float(np.max(volume)), 4),
            },
            "disclaimer": "This AI system is for research and decision support only."
        }
