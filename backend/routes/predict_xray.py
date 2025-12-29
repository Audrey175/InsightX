from fastapi import APIRouter, UploadFile, File
import tempfile
import os

from backend.modules.xray_service import analyze_xray

router = APIRouter()

@router.post("/predict/xray")
async def predict_xray(file: UploadFile = File(...)):
    # Save image temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    # Pass FILE PATH
    result = analyze_xray(tmp_path)

    return {
        "filename": file.filename,
        **result
    }