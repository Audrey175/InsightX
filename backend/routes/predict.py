from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi import APIRouter, UploadFile, File
import tempfile
import os
from backend.modules.prediction_service import analyze_mri
router = APIRouter()

@router.post("/predict")
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

    # "filename": file.filename,
    # **result
    # }

    # os.remove(tmp_path)

    # return result


# @router.post("/predict")
# async def predict(file: UploadFile = File(...)):
#     if not file:
#         raise HTTPException(status_code=400, detail="File is required.")

#     suffix = Path(file.filename or "").suffix or ".h5"
#     with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
#         tmp.write(await file.read())
#         tmp_path = tmp.name

#     try:
#         result = analyze_mri(tmp_path)
#     except FileNotFoundError as exc:
#         raise HTTPException(status_code=500, detail=str(exc)) from exc
#     except Exception as exc:
#         raise HTTPException(
#             status_code=500, detail=f"Failed to analyze MRI: {exc}"
#         ) from exc
#     finally:
#         try:
#             os.remove(tmp_path)
#         except OSError:
#             pass

#     return {
#         "filename": file.filename,
#         **result,
#     }
