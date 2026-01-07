from pathlib import Path

from fastapi import APIRouter

router = APIRouter()

_BASE = Path(__file__).resolve().parents[1] / "models"
_MRI_PATH = _BASE / "unet_brats.pth"
_XRAY_PATH = _BASE / "xray_model.pth"


def _weights_present(path: Path) -> bool:
    return path.exists() and path.stat().st_size > 0


@router.get("/health/models")
def model_health():
    return {
        "mri_weights_present": _weights_present(_MRI_PATH),
        "xray_weights_present": _weights_present(_XRAY_PATH),
        "expected_paths": {
            "mri": "backend/models/unet_brats.pth",
            "xray": "backend/models/xray_model.pth",
        },
    }
