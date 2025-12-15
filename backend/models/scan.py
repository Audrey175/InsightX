from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from backend.data import Base

class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    image_type = Column(String)  # MRI / Xray
    original_path = Column(String)
    reconstruction_path = Column(String)
    detected_injury = Column(String)
    injury_size = Column(Float)
    risk_score = Column(Float)

    patient = relationship("Patient")
