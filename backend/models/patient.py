from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from backend.data.scan_database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    age = Column(Integer)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    dob = Column(Date)
    gender = Column(String)
    medical_history = Column(String)  
    contact_number = Column(String)
    address = Column(String, nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True, index=True)

    doctor = relationship("Doctor", back_populates="patients")
    scans = relationship("Scan", back_populates="patient")
