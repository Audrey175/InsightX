from sqlalchemy import Column, Integer, String, Date
from backend.data.scan_database import Base  # Correct Import

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    dob = Column(Date)
    gender = Column(String)
    contact_number = Column(String)
    address = Column(String, nullable=True)