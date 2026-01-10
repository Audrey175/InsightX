from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from backend.data.scan_database import Base


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, nullable=False, index=True)
    doctor_id = Column(String, nullable=True, index=True)
    modality = Column(String, nullable=False, index=True)
    file_path = Column(String, nullable=False)
    created_at = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, index=True)
    ai_result_json = Column(Text, nullable=True)
    summary_json = Column(Text, nullable=True)
    original_filename = Column(String, nullable=True)
    scan_type = Column(String, default="MRI") # e.g., MRI, CT, X-Ray
    status = Column(String, default="processing") # e.g., processing, completed
    risk_level = Column(String, default="Low") # e.g., High, Medium, Low
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    result = Column(Text, nullable=True)