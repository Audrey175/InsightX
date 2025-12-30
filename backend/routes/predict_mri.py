from fastapi import APIRouter, UploadFile, File
import tempfile

from backend.modules.mri_service import analyze_dicom_zip

router = APIRouter()

@router.post("/predict/mri")
async def predict_mri(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    result = analyze_dicom_zip(tmp_path)

    return {
        "filename": file.filename,
        **result
    }
