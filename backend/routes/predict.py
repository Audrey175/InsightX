from fastapi import APIRouter, UploadFile, File
from backend.modules.prediction_service import diagnose
from PIL import Image
import io

router = APIRouter()

@router.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    # Read image directly from memory
    image_bytes = await file.read()
    img = Image.open(io.BytesIO(image_bytes))

    # Pass PIL image to diagnose function
    result = diagnose(img)

    return {
        "filename": file.filename,
        "prediction": result["prediction"],
        "confidence": result["confidence"]
    }