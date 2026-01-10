import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Import DB
from backend.data.scan_database import init_db

# Import Routers
from backend.routes import (
    dashboard,
    scans,
    patient_router,
    doctor_router,
    auth_router,   # ✅ ADD AUTH
)
from backend.models.chatbot import router as chatbot_router
from backend.routes.predict_xray import router as xray_router
from backend.routes.predict_mri import router as mri_router

load_dotenv()

app = FastAPI(
    title="InsightX API",
    version="1.0.0",
)

# ============================================================
# 1. Middleware (CORS)
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*",  # keep wildcard for now; restrict in prod
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# 2. API Routers
# ============================================================

# --- Auth (REAL login) ---
app.include_router(auth_router.router, prefix="/auth", tags=["Auth"])

# --- Prediction ---
app.include_router(xray_router, tags=["X-Ray"])
app.include_router(mri_router, tags=["MRI"])

# --- Chatbot ---
app.include_router(chatbot_router, prefix="/chat", tags=["Chatbot"])

# --- Core APIs ---
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(scans.router, prefix="/api/scans", tags=["Scans"])
app.include_router(patient_router.router, prefix="/api/patients", tags=["Patients"])
app.include_router(doctor_router.router, prefix="/api/doctors", tags=["Doctors"])

# ============================================================
# 3. Static Files
# ============================================================
# Heatmaps / reconstructions / outputs
app.mount("/static", StaticFiles(directory="backend/static"), name="static")
app.mount(
    "/outputs",
    StaticFiles(directory="backend/static/reconstructions"),
    name="outputs",
)

# ============================================================
# 4. Root Health Check
# ============================================================
@app.get("/")
async def root():
    return {"message": "InsightX Server is running."}

# ============================================================
# 5. Startup
# ============================================================
@app.on_event("startup")
def startup():
    init_db()
