from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.data.scan_database import get_db
from backend.models.doctor import Doctor
from backend.models.patient import Patient
from backend.models.user import User
from backend.routes.auth_router import get_current_user

router = APIRouter()


class DoctorCreate(BaseModel):
    full_name: str
    specialization: Optional[str] = None
    email: Optional[str] = None


class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    specialization: Optional[str] = None
    email: Optional[str] = None


def _serialize_doctor(doctor: Doctor) -> dict:
    return {
        "id": doctor.id,
        "full_name": doctor.full_name,
        "specialization": doctor.specialization,
        "email": doctor.email,
    }


def _serialize_patient(patient: Patient) -> dict:
    return {
        "id": patient.id,
        "full_name": patient.full_name,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "age": patient.age,
        "dob": patient.dob.isoformat() if patient.dob else None,
        "gender": patient.gender,
        "medical_history": patient.medical_history,
        "contact_number": patient.contact_number,
        "address": patient.address,
        "doctor_id": patient.doctor_id,
    }


@router.post("/")
def create_doctor(payload: DoctorCreate, db: Session = Depends(get_db)):
    if payload.email:
        existing = db.query(Doctor).filter(Doctor.email == payload.email).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="Doctor with this email already exists."
            )

    doctor = Doctor(
        full_name=payload.full_name,
        specialization=payload.specialization,
        email=payload.email,
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return _serialize_doctor(doctor)


@router.get("")
def list_doctors(db: Session = Depends(get_db)):
    doctors = db.query(Doctor).order_by(Doctor.id).all()
    return [_serialize_doctor(doctor) for doctor in doctors]


@router.get("/{doctor_id}")
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    return _serialize_doctor(doctor)


@router.put("/{doctor_id}")
def update_doctor(
    doctor_id: int, payload: DoctorUpdate, db: Session = Depends(get_db)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    data = payload.dict(exclude_unset=True)
    if "email" in data and data["email"]:
        existing = (
            db.query(Doctor)
            .filter(Doctor.email == data["email"], Doctor.id != doctor_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=400, detail="Doctor with this email already exists."
            )

    for key, value in data.items():
        setattr(doctor, key, value)

    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return _serialize_doctor(doctor)


@router.get("/{doctor_id}/patients")
def list_doctor_patients(doctor_id: int, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    patients = (
        db.query(Patient).filter(Patient.doctor_id == doctor_id).order_by(Patient.id).all()
    )
    return [_serialize_patient(patient) for patient in patients]


def _require_doctor(current: User) -> int:
    if current.role != "doctor" or current.doctor_id is None:
        raise HTTPException(status_code=403, detail="Doctor access required.")
    return current.doctor_id


@router.post("/me/patients/{patient_id}/claim")
def claim_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    doctor_id = _require_doctor(current)
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    if patient.doctor_id and patient.doctor_id != doctor_id:
        raise HTTPException(status_code=409, detail="Patient already assigned.")

    patient.doctor_id = doctor_id
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return _serialize_patient(patient)


@router.delete("/me/patients/{patient_id}")
def unassign_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    doctor_id = _require_doctor(current)
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    if patient.doctor_id != doctor_id:
        raise HTTPException(
            status_code=403, detail="Patient not assigned to current doctor."
        )

    patient.doctor_id = None
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return {"success": True, "patient": _serialize_patient(patient)}
