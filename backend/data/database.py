from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import pandas as pd
import sqlite3

# ===============================
# 1. CONFIGURATION
# ===============================
DATABASE_URL = "sqlite:///./insightx.db"
CSV_FILE = "assignment3_II.csv"
DB_FILE = "hospital.db"

# SQLAlchemy engine (optional if you want ORM later)
DATABASE_URL = f"sqlite:///{DB_FILE}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# =============================== 
# 2. LOAD CSV 
# ===============================
def load_csv(path):
    df = pd.read_csv(path)
    df.columns = df.columns.str.strip()
    return df


# ===============================
# 3. DATABASE CONNECTION
# ===============================
def create_connection(db_file):
    return sqlite3.connect(db_file)


# ===============================
# 4. DROP & CREATE TABLES
# ===============================
def create_tables(cursor):
    cursor.execute("DROP TABLE IF EXISTS User;")
    cursor.execute("DROP TABLE IF EXISTS Doctor;")
    cursor.execute("DROP TABLE IF EXISTS Patient;")
    cursor.execute("DROP TABLE IF EXISTS DatabaseSystem;")
    cursor.execute("DROP TABLE IF EXISTS MedicalImage;")
    cursor.execute("DROP TABLE IF EXISTS AIReconstructionEngine;")
    cursor.execute("DROP TABLE IF EXISTS Reconstruction3DModel;")
    cursor.execute("DROP TABLE IF EXISTS Dashboard;")
    cursor.execute("DROP TABLE IF EXISTS GeneralDashboard;")
    cursor.execute("DROP TABLE IF EXISTS Chatbot;")
   

    # User table
    cursor.execute("""
    CREATE TABLE User (
        userID INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT,
        email TEXT
    );
    """)

    # Doctor
    cursor.execute("""
    CREATE TABLE Doctor (
        doctorID TEXT PRIMARY KEY,
        doctorName TEXT,
        specialization TEXT
    );
    """)

    # Patient
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

    # DatabaseSystem
    cursor.execute("""
    CREATE TABLE DatabaseSystem (
        dbName TEXT PRIMARY KEY,
        storageSize INTEGER
    );
    """)

    # MedicalImage table
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

    # AIReconstructionEngine table
    cursor.execute("""
    CREATE TABLE AIReconstructionEngine (
        modelVersion TEXT PRIMARY KEY,
        accuracy INTEGER,
        errorRate Integer,
    );
    """)

    # Reconstruction3DModel table
    cursor.execute("""
    CREATE TABLE Reconstruction3DModel (
        modelID TEXT PRIMARY KEY ,
        patientID TEXT,
        sourceImageID TEXT,
        filePath3DModel TEXT,
        visualizationData TEXT,
        confidenceScore TEXT,
        FOREIGN KEY (patientID) REFERENCES Patient(patientID)        
    );
    """)

    # Dashboard table
    cursor.execute("""
    CREATE TABLE Dashboard (
        dashboardID TEXT PRIMARY KEY ,
        patientID TEXT,
        dashboardType TEXT,
        statisticsData INTEGER,
        diseaseTrends TEXT,
        predictionResults TEXT,
        FOREIGN KEY (patientID) REFERENCES Patient(patientID)        
    );
    """)

    # ! Alert
    # GeneralDashboard table
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

    # Chatbot table
    cursor.execute("""
    CREATE TABLE Chatbot (
        chatbotID TEXT PRIMARY KEY ,
        modelName TEXT,
        knowledgeBase TEXT,
    );
    """)


# ===============================
# 5. INSERT DATA FUNCTIONS
# ===============================
def insert_users(cursor, df):
    if "username" not in df.columns:
        return

    user_df = df.drop_duplicates(subset=["username"])[[
        "username", "password", "role", "email"
    ]]

    for _, row in user_df.iterrows():
        cursor.execute("""
            INSERT INTO User (username, password, role, email)
            VALUES (?, ?, ?, ?)
        """, tuple(row))

def insert_patients(cursor, df):
    patient_df = df.drop_duplicates(subset=["patientID"])[[
        "patientID", "patientName", "age", "gender", "medicalHistory",
        "currentCondition", "admissionWeek", "criticalScore", "doctorID"
    ]]

    for _, row in patient_df.iterrows():
        cursor.execute("""
            INSERT INTO Patient (patientID, patientName, age, gender, medicalHistory, 
            currentCondition, admissionWeek, criticalScore, doctorID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, tuple(row))


def insert_doctors(cursor, df):
    doctor_df = df.drop_duplicates(subset=["doctorID"])[[
        "doctorID", "doctorName", "specialization"
    ]]

    for _, row in doctor_df.iterrows():
        cursor.execute("""
            INSERT INTO Doctor (doctorID, doctorName, specialization)
            VALUES (?, ?, ?)
        """, tuple(row))


def insert_database_system(cursor, df):
    db_df = df.drop_duplicates(subset=["dbName"])[[
        "dbName", "storageSize"
    ]]

    for _, row in db_df.iterrows():
        cursor.execute("""
            INSERT INTO DatabaseSystem (dbName, storageSize)
            VALUES (?, ?)
        """, tuple(row))

def insert_medical_images(cursor, df):
    required_cols = ["imageID", "patientID", "imageType", "filePath", "uploadDate", "anonymizedVersionPath"]

    if not all(col in df.columns for col in required_cols):
        return

    img_df = df.drop_duplicates(subset=["imageID"])[required_cols]

    for _, row in img_df.iterrows():
        cursor.execute("""
            INSERT INTO MedicalImage (
                imageID, patientID, imageType, filePath, uploadDate, anonymizedVersionPath
            )
            VALUES (?, ?, ?, ?, ?, ?)
        """, tuple(row))

def insert_ai_reconstruction_engine(cursor, df):
    if "modelVersion" not in df.columns:
        return

    engine_df = df.drop_duplicates(subset=["modelVersion"])[[
        "modelVersion", "accuracy", "errorRate"
    ]]

    for _, row in engine_df.iterrows():
        cursor.execute("""
            INSERT INTO AIReconstructionEngine VALUES (?, ?, ?)
        """, tuple(row))


def insert_reconstruction_3d_model(cursor, df):
    required = [
        "modelID", "patientID", "sourceImageID",
        "filePath3DModel", "visualizationData", "confidenceScore"
    ]

    if not all(x in df.columns for x in required):
        return

    rec_df = df.drop_duplicates(subset=["modelID"])[required]

    for _, row in rec_df.iterrows():
        cursor.execute("""
            INSERT INTO Reconstruction3DModel VALUES (?, ?, ?, ?, ?, ?)
        """, tuple(row))


def insert_dashboard(cursor, df):
    if "dashboardID" not in df.columns:
        return

    dash_df = df.drop_duplicates(subset=["dashboardID"])[[
        "dashboardID", "patientID", "dashboardType",
        "statisticsData", "diseaseTrends", "predictionResults"
    ]]

    for _, row in dash_df.iterrows():
        cursor.execute("""
            INSERT INTO Dashboard VALUES (?, ?, ?, ?, ?, ?)
        """, tuple(row))


def insert_general_dashboard(cursor, df):
    if "dashboardID" not in df.columns:
        return

    gen_df = df.drop_duplicates(subset=["dashboardID"])[[
        "dashboardID", "totalPatients", "totalDiseaseCases",
        "successfullyTreated", "highRiskIdentified", "searchQuery"
    ]]

    for _, row in gen_df.iterrows():
        cursor.execute("""
            INSERT INTO GeneralDashboard VALUES (?, ?, ?, ?, ?, ?)
        """, tuple(row))


def insert_chatbot(cursor, df):
    if "chatbotID" not in df.columns:
        return

    chatbot_df = df.drop_duplicates(subset=["chatbotID"])[[
        "chatbotID", "modelName", "knowledgeBase"
    ]]

    for _, row in chatbot_df.iterrows():
        cursor.execute("""
            INSERT INTO Chatbot VALUES (?, ?, ?)
        """, tuple(row))


        
# ===============================
# 6. MAIN BUILD SCRIPT
# ===============================
def build_database():
    df = load_csv(CSV_FILE)

    conn = create_connection(DB_FILE)
    cursor = conn.cursor()

    insert_users(cursor, df)
    insert_doctors(cursor, df)
    insert_patients(cursor, df)
    insert_database_system(cursor, df)
    insert_medical_images(cursor, df)
    insert_ai_reconstruction_engine(cursor, df)
    insert_reconstruction_3d_model(cursor, df)
    insert_dashboard(cursor, df)
    insert_general_dashboard(cursor, df)
    insert_chatbot(cursor, df)

    conn.commit()
    conn.close()
    print("Database created successfully:", DB_FILE)


# ===============================
# 7. PREVIEW SAMPLE ROWS
# ===============================
def preview_samples():
    conn = create_connection(DB_FILE)
    cursor = conn.cursor()

    print("Sample User row:", cursor.execute("SELECT * FROM User LIMIT 1;").fetchone())
    print("Sample Patient row:", cursor.execute("SELECT * FROM Patient LIMIT 1;").fetchone())
    print("Sample Doctor row:", cursor.execute("SELECT * FROM Doctor LIMIT 1;").fetchone())
    print("Sample DatabaseSystem row:", cursor.execute("SELECT * FROM DatabaseSystem LIMIT 1;").fetchone())
    print("Sample MedicalImage row:", cursor.execute("SELECT * FROM MedicalImage LIMIT 1;").fetchone())
    print("Sample AIReconstructionEngine row:", cursor.execute("SELECT * FROM AIReconstructionEngine LIMIT 1;").fetchone())
    print("Sample Reconstruction3DModel row:", cursor.execute("SELECT * FROM Reconstruction3DModel LIMIT 1;").fetchone())
    print("Sample Dashboard row:", cursor.execute("SELECT * FROM Dashboard LIMIT 1;").fetchone())
    print("Sample GeneralDashboard row:", cursor.execute("SELECT * FROM GeneralDashboard LIMIT 1;").fetchone())
    print("Sample Chatbot row:", cursor.execute("SELECT * FROM Chatbot LIMIT 1;").fetchone())

    conn.close()


# ===============================
# 8. RUN SCRIPT
# ===============================
if __name__ == "__main__":
    build_database()
    preview_samples()
