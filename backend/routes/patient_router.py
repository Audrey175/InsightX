from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.data.scan_database import get_db
from backend.models.doctor import Doctor
from backend.models.patient import Patient

router = APIRouter()


class PatientCreate(BaseModel):
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    age: Optional[int] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    medical_history: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    doctor_id: Optional[int] = None


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    age: Optional[int] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    medical_history: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    doctor_id: Optional[int] = None


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
def create_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    data = payload.dict(exclude_unset=True)
    if data.get("doctor_id") is not None:
        doctor = db.query(Doctor).filter(Doctor.id == data["doctor_id"]).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found.")

    if not data.get("full_name"):
        composed = " ".join(
            part for part in [data.get("first_name"), data.get("last_name")] if part
        ).strip()
        if composed:
            data["full_name"] = composed

    patient = Patient(**data)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return _serialize_patient(patient)


@router.get("")
def list_patients(
    unassigned: Optional[bool] = None, db: Session = Depends(get_db)
):
    query = db.query(Patient)
    if unassigned is True:
        query = query.filter(Patient.doctor_id == None)  # noqa: E711
    patients = query.order_by(Patient.id).all()
    return [_serialize_patient(patient) for patient in patients]


@router.get("/{patient_id}")
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    return _serialize_patient(patient)


@router.put("/{patient_id}")
def update_patient(
    patient_id: int, payload: PatientUpdate, db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    data = payload.dict(exclude_unset=True)
    if data.get("doctor_id") is not None:
        doctor = db.query(Doctor).filter(Doctor.id == data["doctor_id"]).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found.")

    if "full_name" in data and data["full_name"]:
        if not data.get("first_name") and not data.get("last_name"):
            parts = data["full_name"].strip().split()
            if parts:
                data.setdefault("first_name", parts[0])
                if len(parts) > 1:
                    data.setdefault("last_name", " ".join(parts[1:]))

    for key, value in data.items():
        setattr(patient, key, value)

    db.add(patient)
    db.commit()
    db.refresh(patient)
    return _serialize_patient(patient)
