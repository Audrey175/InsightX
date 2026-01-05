from fastapi import APIRouter, UploadFile, File
import tempfile
import os
# from fastapi import APIRouter, UploadFile, File, HTTPException
# import tempfile
# import os
# from pathlib import Path

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

# @router.post("/predict/xray")
# async def predict_xray(file: UploadFile = File(...)):
#     if not file:
#         raise HTTPException(status_code=400, detail="File is required.")

#     suffix = Path(file.filename or "").suffix or ".png"
#     with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
#         tmp.write(await file.read())
#         tmp_path = tmp.name

#     try:
#         result = analyze_xray(tmp_path)
#     except FileNotFoundError as exc:
#         raise HTTPException(status_code=500, detail=str(exc)) from exc
#     except Exception as exc:
#         raise HTTPException(
#             status_code=500, detail=f"Failed to analyze X-ray: {exc}"
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
