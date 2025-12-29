from fastapi import APIRouter, UploadFile, File
import tempfile
import os

from backend.modules.prediction_service import analyze_mri

router = APIRouter()

@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".h5") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    result = analyze_mri(tmp_path)
    return {
    "filename": file.filename,
    **result
    }

    # os.remove(tmp_path)

    # return result