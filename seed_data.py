import sys
import os

sys.path.append(os.getcwd())

from backend.data.scan_database import SessionLocal, init_db
from backend.models.patient import Patient
from backend.models.scan import Scan
from datetime import date, datetime, timedelta
import random

try:
    print("🔄 Initializing database...")
    init_db()
    db = SessionLocal()
    print("✅ Database connection successful.")
except Exception as e:
    print(f"❌ Error connecting to database: {e}")
    sys.exit(1)

print("🌱 Seeding data...")

try:
    # 1. Create Dummy Patients
    patients = [
        Patient(first_name="John", last_name="Doe", dob=date(1980, 1, 1), gender="Male", contact_number="1234567890"),
        Patient(first_name="Jane", last_name="Smith", dob=date(1992, 5, 15), gender="Female", contact_number="0987654321"),
        Patient(first_name="Robert", last_name="Johnson", dob=date(1975, 11, 30), gender="Male", contact_number="1122334455"),
        Patient(first_name="Emily", last_name="Davis", dob=date(1988, 3, 22), gender="Female", contact_number="5566778899"),
        Patient(first_name="Michael", last_name="Brown", dob=date(1960, 8, 10), gender="Male", contact_number="6677889900"),
    ]

    # Add patients
    for p in patients:
        db.add(p)
    db.commit()

    # Refresh to get IDs
    for p in patients:
        db.refresh(p)

    print(f"✅ Added {len(patients)} patients.")

    # 2. Create Dummy Scans
    scan_types = ["MRI", "CT", "X-Ray"]
    statuses = ["processing", "completed", "failed"]
    risks = ["Low", "Medium", "High"]

    scans = []
    for i in range(15): 
        patient = random.choice(patients)
        random_days = random.randint(0, 30)
        scan_date = datetime.now() - timedelta(days=random_days)
        chosen_type = random.choice(scan_types)

        scan = Scan(
            patient_id=patient.id,
            # Required Database Fields:
            modality=chosen_type,
            file_path=f"dummy_uploads/scan_{i}.jpg",  
            original_filename=f"patient_{patient.id}_scan.jpg", 
            
            # Dashboard Fields:
            scan_type=chosen_type,
            status=random.choice(statuses),
            risk_level=random.choice(risks),
            created_at=scan_date,
            result=f"Routine checkup result for {patient.first_name}"
        )
        scans.append(scan)

    db.add_all(scans)
    db.commit()

    print(f"✅ Added {len(scans)} scans.")
    print("🚀 Database seeded successfully! Refresh your dashboard.")

except Exception as e:
    print(f"❌ Error during seeding: {e}")
finally:
    db.close()