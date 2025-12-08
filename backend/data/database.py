from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import sqlite3

# ===============================
# 1. CONFIG
# ===============================
DB_FILE = "hospital.db"     # final output DB

# SQLAlchemy engine (optional if you want ORM later)
DATABASE_URL = f"sqlite:///{DB_FILE}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ===============================
# 2. RAW SQLITE CONNECTION
# ===============================
def create_connection(db_file):
    return sqlite3.connect(db_file)


# ===============================
# 3. DROP & CREATE TABLES
# ===============================
def create_tables(cursor):

    # --- DROP OLD TABLES ---
    tables = [
        "User", "Doctor", "Patient", "DatabaseSystem",
        "MedicalImage", "AIReconstructionEngine",
        "Reconstruction3DModel", "Dashboard",
        "GeneralDashboard", "Chatbot"
    ]
    for t in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {t};")

    # --- CREATE TABLES ---

    cursor.execute("""
    CREATE TABLE User (
        userID INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT,
        email TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE Doctor (
        doctorID TEXT PRIMARY KEY,
        doctorName TEXT,
        specialization TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE Patient (
        patientID TEXT PRIMARY KEY,
        patientName TEXT,
        age INTEGER,
        gender TEXT,
        medicalHistory TEXT,
        currentCondition TEXT,
        admissionWeek INTEGER,
        criticalScore INTEGER,
        doctorID TEXT,
        FOREIGN KEY (doctorID) REFERENCES Doctor(doctorID)
    );
    """)

    cursor.execute("""
    CREATE TABLE DatabaseSystem (
        dbName TEXT PRIMARY KEY,
        storageSize INTEGER
    );
    """)

    cursor.execute("""
    CREATE TABLE MedicalImage (
        imageID TEXT PRIMARY KEY,
        patientID TEXT,
        imageType TEXT,
        filePath TEXT,
        uploadDate TEXT,
        anonymizedVersionPath TEXT,
        FOREIGN KEY (patientID) REFERENCES Patient(patientID)
    );
    """)

    cursor.execute("""
    CREATE TABLE AIReconstructionEngine (
        modelVersion TEXT PRIMARY KEY,
        accuracy INTEGER,
        errorRate INTEGER
    );
    """)

    cursor.execute("""
    CREATE TABLE Reconstruction3DModel (
        modelID TEXT PRIMARY KEY,
        patientID TEXT,
        sourceImageID TEXT,
        filePath3DModel TEXT,
        visualizationData TEXT,
        confidenceScore TEXT,
        FOREIGN KEY (patientID) REFERENCES Patient(patientID)
    );
    """)

    cursor.execute("""
    CREATE TABLE Dashboard (
        dashboardID TEXT PRIMARY KEY,
        patientID TEXT,
        dashboardType TEXT,
        statisticsData TEXT,
        diseaseTrends TEXT,
        predictionResults TEXT,
        FOREIGN KEY (patientID) REFERENCES Patient(patientID)
    );
    """)

    cursor.execute("""
    CREATE TABLE GeneralDashboard (
        dashboardID TEXT PRIMARY KEY,
        totalPatients INTEGER,
        totalDiseaseCases INTEGER,
        successfullyTreated INTEGER,
        highRiskIdentified INTEGER,
        searchQuery TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE Chatbot (
        chatbotID TEXT PRIMARY KEY,
        modelName TEXT,
        knowledgeBase TEXT
    );
    """)


# ===============================
# MAIN
# ===============================
def build_database():
    conn = create_connection(DB_FILE)
    cursor = conn.cursor()

    create_tables(cursor)

    conn.commit()
    conn.close()
    print("Database created successfully:", DB_FILE)


# ===============================
# RUN
# ===============================
if __name__ == "__main__":
    build_database()
