from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.data.scan_database import Base


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True, index=True)
    modality = Column(String, nullable=False, index=True)
    file_path = Column(String, nullable=False)
    original_filename = Column(String, nullable=True)
    status = Column(String, nullable=False, default="processing", index=True)
    risk_level = Column(String, nullable=False, default="Low", index=True)
    ai_result_json = Column(Text, nullable=True)
    summary_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        index=True,
    )
    result = Column(Text, nullable=True)
    review_status = Column(String, nullable=True, index=True)
    clinician_note = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="scans")
    doctor = relationship("Doctor", back_populates="scans")
