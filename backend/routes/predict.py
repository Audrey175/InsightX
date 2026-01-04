# from fastapi import APIRouter, UploadFile, File
# import tempfile
# import os

# from backend.modules.prediction_service import analyze_mri

# router = APIRouter()

# @router.post("/predict")
# async def predict(file: UploadFile = File(...)):
#     # Save uploaded file temporarily
#     with tempfile.NamedTemporaryFile(delete=False, suffix=".h5") as tmp:
#         tmp.write(await file.read())
#         tmp_path = tmp.name

#     result = analyze_mri(tmp_path)
#     return {
#     "filename": file.filename,
#     **result
#     }

#     # os.remove(tmp_path)

#     # return result

from fastapi import APIRouter, UploadFile, File, HTTPException
import tempfile
import os

from backend.modules.prediction_service import analyze_mri

router = APIRouter()

@router.post("/predict")
# async def predict(file: UploadFile = File(...)):
#     with tempfile.NamedTemporaryFile(delete=False, suffix=".h5") as tmp:
#         tmp.write(await file.read())
#         tmp_path = tmp.name

#     result = analyze_mri(tmp_path)
#     os.remove(tmp_path)

#     return {
#         "filename": file.filename,
#         **result
#     }
async def predict(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1].lower()

    if suffix not in [".jpg", ".png", ".jpeg"]:
        raise HTTPException(
            status_code=400,
            detail="Only image files are supported"
        )

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        result = analyze_mri(tmp_path)
    finally:
        os.remove(tmp_path)

    return {
        "filename": file.filename,
        **result
    }