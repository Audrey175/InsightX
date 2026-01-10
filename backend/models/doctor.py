from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from backend.data.scan_database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    specialization = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=True)

    patients = relationship("Patient", back_populates="doctor")
    scans = relationship("Scan", back_populates="doctor")
