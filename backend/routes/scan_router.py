from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
# from database import SessionLocal
from backend.models.scan import Scan
# from services.reconstruction_service import reconstruct_3d, analyze_injury

import shutil
import uuid
import os

router = APIRouter()

UPLOAD_DIR = "uploads/"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/upload")
async def upload_scan(patient_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):

    # save file
    file_id = str(uuid.uuid4())
    saved_path = f"{UPLOAD_DIR}/{file_id}_{file.filename}"

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # run reconstruction (BrainChop/MONAI)
    reconstruction_path = reconstruct_3d(saved_path)

    # run injury analysis (your own logic)
    result = analyze_injury(reconstruction_path)

    # save to DB
    scan = Scan(
        patient_id=patient_id,
        file_path=saved_path,
        reconstruction_path=reconstruction_path,
        injury_size_mm=result["injury_size_mm"],
        classification=result["classification"],
        risks=result["risks_json"]
    )
    
    db.add(scan)
    db.commit()
    db.refresh(scan)

    return {
        "message": "Scan processed successfully.",
        "scan_id": scan.id,
        "results": result
    }
