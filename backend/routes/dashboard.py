from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.scan import Scan

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/doctor")
def doctor_dashboard(db: Session = Depends(get_db)):

    total_scans = db.query(Scan).count()
    injuries = db.query(Scan.detected_injury).all()
    high_risk = db.query(Scan).filter(Scan.risk_score > 0.7).count()

    return {
        "total_scans": total_scans,
        "common_injuries": injuries,
        "high_risk_cases": high_risk
    }


@router.get("/patient/{patient_id}")
def patient_dashboard(patient_id: int, db: Session = Depends(get_db)):
    scans = db.query(Scan).filter(Scan.patient_id == patient_id).all()

    return {
        "scan_history": scans,
        "total_scans": len(scans),
        "latest_injury": scans[-1].detected_injury if scans else None
    }
