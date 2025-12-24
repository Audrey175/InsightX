from sqlalchemy import Column, Integer, String
from backend.data.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # Store hashed passwords here
    role = Column(String, nullable=False)      # 'patient', 'doctor', 'admin', 'researcher'
    avatar = Column(String, nullable=True)     # URL to avatar image