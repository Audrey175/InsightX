import os
import random
import sys
from datetime import date, datetime, timedelta

sys.path.append(os.getcwd())

from backend.data.scan_database import SessionLocal, init_db
from backend.models.doctor import Doctor
from backend.models.patient import Patient
from backend.models.scan import Scan

# ✅ NEW: user auth model + password hashing
from backend.models.user import User
from backend.auth.security import hash_password


DEFAULT_DOCTOR_PASSWORD = os.getenv("SEED_DOCTOR_PASSWORD", "InsightX@123")
DEFAULT_PATIENT_PASSWORD = os.getenv("SEED_PATIENT_PASSWORD", "Patient@123")


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        # If data exists, skip
        if db.query(Doctor).first():
            print("Seed data already present; skipping.")
            return

        # -----------------------------
        # 1) Seed Doctors
        # -----------------------------
        doctors = [
            Doctor(
                full_name="Dr. Amina Patel",
                specialization="Radiology",
                email="amina.patel@insightx.dev",
            ),
            Doctor(
                full_name="Dr. Luis Romero",
                specialization="Neurology",
                email="luis.romero@insightx.dev",
            ),
            Doctor(
                full_name="Dr. Chloe Martin",
                specialization="Cardiology",
                email="chloe.martin@insightx.dev",
            ),
            Doctor(
                full_name="Dr. Ethan Brooks",
                specialization="Oncology",
                email="ethan.brooks@insightx.dev",
            ),
        ]
        db.add_all(doctors)
        db.commit()
        for doctor in doctors:
            db.refresh(doctor)

        # -----------------------------
        # 2) Seed Patients
        # -----------------------------
        first_names = [
            "John",
            "Jane",
            "Robert",
            "Emily",
            "Michael",
            "Sara",
            "David",
            "Mia",
            "James",
            "Olivia",
            "Noah",
            "Sophia",
        ]
        last_names = [
            "Doe",
            "Smith",
            "Johnson",
            "Davis",
            "Brown",
            "Wilson",
            "Taylor",
            "Anderson",
            "Thomas",
            "Moore",
            "Martin",
            "Lee",
        ]
        genders = ["Male", "Female", "Non-binary"]

        patients: list[Patient] = []
        for idx in range(12):
            first_name = first_names[idx]
            last_name = last_names[idx]
            age = random.randint(18, 80)
            dob = date.today() - timedelta(days=age * 365)
            doctor = random.choice(doctors)

            patients.append(
                Patient(
                    full_name=f"{first_name} {last_name}",
                    first_name=first_name,
                    last_name=last_name,
                    age=age,
                    dob=dob,
                    gender=random.choice(genders),
                    medical_history="Routine monitoring",
                    contact_number=f"555-010{idx:02d}",
                    address="123 InsightX Ave",
                    doctor_id=doctor.id,
                )
            )

        db.add_all(patients)
        db.commit()
        for patient in patients:
            db.refresh(patient)

        # -----------------------------
        # 3) Seed Scans
        # -----------------------------
        modalities = ["mri", "xray", "ct", "general"]
        statuses = ["processing", "completed", "failed", "uploaded"]
        risks = ["Low", "Medium", "High"]

        scans: list[Scan] = []
        for i in range(24):
            patient = random.choice(patients)
            scan_date = datetime.utcnow() - timedelta(days=random.randint(0, 45))
            modality = random.choice(modalities)

            scans.append(
                Scan(
                    patient_id=patient.id,
                    doctor_id=patient.doctor_id,
                    modality=modality,
                    file_path=f"uploads/seed/scan_{i}.dcm",
                    original_filename=f"patient_{patient.id}_{modality}_{i}.dcm",
                    status=random.choice(statuses),
                    risk_level=random.choice(risks),
                    created_at=scan_date,
                    result=f"Routine {modality.upper()} scan.",
                )
            )

        db.add_all(scans)
        db.commit()

        # -----------------------------
        # 4) Seed AUTH Users (PERMANENT LOGIN)
        # -----------------------------
        users: list[User] = []

        # Doctor accounts (login by seeded doctor email)
        for d in doctors:
            users.append(
                User(
                    email=d.email.lower(),
                    password_hash=hash_password(DEFAULT_DOCTOR_PASSWORD),
                    role="doctor",
                    full_name=d.full_name,
                    doctor_id=d.id,
                    patient_id=None,
                )
            )

        # Optional: Patient accounts (login as patient)
        # If you don’t want patient login, you can delete this block.
        for p in patients:
            patient_email = f"patient{p.id}@insightx.dev"
            users.append(
                User(
                    email=patient_email.lower(),
                    password_hash=hash_password(DEFAULT_PATIENT_PASSWORD),
                    role="patient",
                    full_name=p.full_name,
                    doctor_id=None,
                    patient_id=p.id,
                )
            )

        db.add_all(users)
        db.commit()

        print(
            f"Seeded {len(doctors)} doctors, {len(patients)} patients, "
            f"{len(scans)} scans, {len(users)} auth users."
        )
        print(f"Doctor login password: {DEFAULT_DOCTOR_PASSWORD}")
        print(f"Patient login password: {DEFAULT_PATIENT_PASSWORD}")
        print("Example doctor login: amina.patel@insightx.dev")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
