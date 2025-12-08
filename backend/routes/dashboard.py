from fastapi import APIRouter
from sqlalchemy.orm import Session
# from database import SessionLocal
from models.scan import Scan

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/overview")
def dashboard_overview(db: Session = Depends(get_db)):
    total_scans = db.query(Scan).count()
    classifications = db.query(Scan.classification).all()

    return {
        "total_scans": total_scans,
        "injury_types": classifications
    }
