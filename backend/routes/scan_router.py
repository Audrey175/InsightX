import shutil
from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.scan import Scan
from app.services.reconstruction_service import reconstruct_3d
from app.services.prediction_service import analyze_injury

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/upload/{patient_id}")
async def upload_scan(patient_id: int,
                      image: UploadFile = File(...),
                      db: Session = Depends(get_db)):

    # Save file
    file_path = f"uploads/{image.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # 3D Reconstruction
    reconstruction_path = reconstruct_3d(file_path)

    # Prediction Model
    injury_result = analyze_injury(reconstruction_path)

    # Save scan record
    scan = Scan(
        patient_id=patient_id,
        image_type=injury_result["image_type"],
        original_path=file_path,
        reconstruction_path=reconstruction_path,
        detected_injury=injury_result["injury"],
        injury_size=injury_result["injury_size"],
        risk_score=injury_result["risk_score"]
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    return {
        "scan_id": scan.id,
        "message": "Scan processed successfully",
        "injury": scan.detected_injury,
        "risk_score": scan.risk_score
    }
