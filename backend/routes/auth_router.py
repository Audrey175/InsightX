# backend/routes/auth_router.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from jose import jwt, JWTError
import os
import re

from backend.data.scan_database import get_db
from backend.models.doctor import Doctor
from backend.models.patient import Patient
from backend.models.user import User
from backend.auth.security import (
    create_access_token,
    hash_password,
    verify_password,
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME_IN_PROD")
JWT_ALG = "HS256"

class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class RegisterPayload(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str
    doctor_id: int | None = None


class ChangePasswordPayload(BaseModel):
    current_password: str
    new_password: str

def _validate_password(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long.",
        )
    if not re.search(r"[A-Za-z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must include at least one letter.",
        )
    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=400,
            detail="Password must include at least one digit.",
        )

@router.post("/login")
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id), "role": user.role})

    return {
        "token": token,
        "user": {
            "id": str(user.id),
            "role": user.role,
            "email": user.email,
            "fullName": user.full_name,
            "doctorId": str(user.doctor_id) if user.doctor_id is not None else None,
            "patientId": str(user.patient_id) if user.patient_id is not None else None,
        },
    }


@router.post("/register")
def register(payload: RegisterPayload, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    role = payload.role.strip().lower()
    if role not in {"doctor", "patient"}:
        raise HTTPException(status_code=400, detail="Invalid role.")

    _validate_password(payload.password)

    doctor_id = None
    patient_id = None

    if role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.email == email).first()
        if not doctor:
            doctor = Doctor(full_name=payload.full_name, email=email)
            db.add(doctor)
            db.commit()
            db.refresh(doctor)
        doctor_id = doctor.id
    elif role == "patient":
        doctor_ref = None
        if payload.doctor_id is not None:
            doctor_ref = (
                db.query(Doctor).filter(Doctor.id == payload.doctor_id).first()
            )
            if not doctor_ref:
                raise HTTPException(status_code=404, detail="Doctor not found.")

        parts = payload.full_name.strip().split()
        first_name = parts[0] if parts else None
        last_name = " ".join(parts[1:]) if len(parts) > 1 else None
        patient = Patient(
            full_name=payload.full_name,
            first_name=first_name,
            last_name=last_name,
            doctor_id=doctor_ref.id if doctor_ref else None,
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
        patient_id = patient.id

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        role=role,
        full_name=payload.full_name,
        doctor_id=doctor_id,
        patient_id=patient_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "token": token,
        "user": {
            "id": str(user.id),
            "role": user.role,
            "email": user.email,
            "fullName": user.full_name,
            "doctorId": str(user.doctor_id) if user.doctor_id is not None else None,
            "patientId": str(user.patient_id) if user.patient_id is not None else None,
        },
    }

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/me")
def me(current: User = Depends(get_current_user)):
    return {
        "id": str(current.id),
        "role": current.role,
        "email": current.email,
        "fullName": current.full_name,
        "doctorId": str(current.doctor_id) if current.doctor_id is not None else None,
        "patientId": str(current.patient_id) if current.patient_id is not None else None,
    }


@router.post("/change-password")
def change_password(
    payload: ChangePasswordPayload,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    _validate_password(payload.new_password)

    current.password_hash = hash_password(payload.new_password)
    db.add(current)
    db.commit()
    return {"success": True}
