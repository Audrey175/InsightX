from sqlalchemy import Column, Integer, String, ForeignKey
from backend.data.scan_database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)

    # "doctor" | "patient"
    role = Column(String, nullable=False, index=True)

    full_name = Column(String, nullable=False)

    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True, index=True)
