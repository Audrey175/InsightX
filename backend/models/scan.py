from sqlalchemy import Column, Integer, String, Text

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
