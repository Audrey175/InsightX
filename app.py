import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware


# Import Routers
from backend.data.scan_database import init_db
from backend.routes import dashboard, scans, patient_router 
from backend.models.chatbot import router as chatbot_router
from backend.routes.predict_xray import router as xray_router  
from backend.routes.predict_mri import router as mri_router


load_dotenv()

app = FastAPI(title="InsightX API")

# 1. Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Routers (Included only once)
app.include_router(xray_router, tags=["X-Ray"])
app.include_router(mri_router, tags=["MRI"])
app.include_router(chatbot_router, prefix="/chat", tags=["Chatbot"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(scans.router, prefix="/api/scans", tags=["Scans"])
app.include_router(patient_router.router, prefix="/api/patients", tags=["Patients"])

# 3. Static Files (One mount per directory)
# Consolidating heatmaps/outputs to one mount point
app.mount("/static", StaticFiles(directory="backend/static"), name="static")
app.mount("/outputs", StaticFiles(directory="backend/static/reconstructions"), name="outputs")

@app.get("/")
async def root():
    return {"message": "InsightX Server is running."}

@app.on_event("startup")
def startup(): 
    init_db()