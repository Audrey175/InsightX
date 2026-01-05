from sqlalchemy import Column, Integer, String, Date
from backend.data.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    medical_history = Column(String)  
