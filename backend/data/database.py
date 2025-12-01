from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

import pandas as pd
import sqlite3


DATABASE_URL = "sqlite:///./insightx.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
import pandas as pd
import sqlite3

# Load CSV
df = pd.read_csv("assignment3_II.csv")
df.columns = df.columns.str.strip()

# Connect to SQLite
conn = sqlite3.connect("hospital.db")
cursor = conn.cursor()

# Drop old tables
cursor.execute("DROP TABLE IF EXISTS Doctor;")
cursor.execute("DROP TABLE IF EXISTS Patient;")
cursor.execute("DROP TABLE IF EXISTS DoctorPatient;")

# Create Patient Table
cursor.execute("""
CREATE TABLE Patient (
    patientID TEXT PRIMARY KEY,
    age INTEGER,
    gender TEXT,
    medicalHistory TEXT,
    currentCondition TEXT,
    admissionWeek INTEGER,
    criticalScore INTEGER
);
""")

# Create Doctor Table
cursor.execute("""
CREATE TABLE Doctor (
    doctorID TEXT PRIMARY KEY,
    specialization TEXT
);
""")

# Doctor–Patient Linking Table (Many-to-Many)
cursor.execute("""
CREATE TABLE DoctorPatient (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctorID TEXT,
    patientID TEXT,
    FOREIGN KEY (doctorID) REFERENCES Doctor(doctorID),
    FOREIGN KEY (patientID) REFERENCES Patient(patientID)
);
""")

# ------------------------------
# Insert into Patient Table
# ------------------------------
patient_df = df.drop_duplicates(subset=["patientID"])[[
    "patientID", "age", "gender", "medicalHistory",
    "currentCondition", "admissionWeek", "criticalScore"
]]

for _, row in patient_df.iterrows():
    cursor.execute("""
        INSERT INTO Patient (patientID, age, gender, medicalHistory, currentCondition, admissionWeek, criticalScore)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        row["patientID"],
        row["age"],
        row["gender"],
        row["medicalHistory"],
        row["currentCondition"],
        row["admissionWeek"],
        row["criticalScore"]
    ))

# ------------------------------
# Insert into Doctor Table
# ------------------------------
doctor_df = df.drop_duplicates(subset=["doctorID"])[[
    "doctorID", "specialization"
]]

for _, row in doctor_df.iterrows():
    cursor.execute("""
        INSERT INTO Doctor (doctorID, specialization)
        VALUES (?, ?)
    """, (
        row["doctorID"],
        row["specialization"]
    ))

# ------------------------------
# Insert into DoctorPatient relationship table
# ------------------------------
if "assignedPatientID" in df.columns:  
    for _, row in df.iterrows():
        cursor.execute("""
            INSERT INTO DoctorPatient (doctorID, patientID)
            VALUES (?, ?)
        """, (
            row["doctorID"],
            row["assignedPatientID"]
        ))

# Commit and close
conn.commit()
conn.close()

print("Database created successfully: hospital.db")

# Preview sample rows
conn = sqlite3.connect("hospital.db")
cursor = conn.cursor()

print("Sample Patient row:", cursor.execute("SELECT * FROM Patient LIMIT 1;").fetchone())
print("Sample Doctor row:", cursor.execute("SELECT * FROM Doctor LIMIT 1;").fetchone())
print("Sample DoctorPatient row:", cursor.execute("SELECT * FROM DoctorPatient LIMIT 1;").fetchone())

conn.close()
