from fastapi import APIRouter, UploadFile, File
import shutil
import os
import uuid

from backend.modules.xray_service import analyze_xray

router = APIRouter()

# UPLOAD_DIR = "backend/uploads/xray"
# os.makedirs(UPLOAD_DIR, exist_ok=True)

# @router.post("/predict/xray")
# async def predict_xray(file: UploadFile = File(...)):
#     file_ext = file.filename.split(".")[-1]
#     filename = f"{uuid.uuid4()}.{file_ext}"
#     file_path = os.path.join(UPLOAD_DIR, filename)

#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)

#     result = analyze_xray(file_path)

#     return {
#         "filename": file.filename,
#         **result
#     }
@router.post("/predict/xray")
async def predict_xray(file: UploadFile = File(...)):
    image_bytes = await file.read()

    result = analyze_xray(image_bytes)

    return {
        "filename": file.filename,
        **result
    }