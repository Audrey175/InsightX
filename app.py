from fastapi import FastAPI
# from app.database import Base, engine
# from app.routers.patient_router import router as patient_router
# from app.routers.scan_router import router as scan_router
# from app.routers.dashboard_router import router as dashboard_router
from backend.routes.predict import router as prediction_router
from backend.routes.predict_xray import router as xray_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles




# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Medical Imaging System",
    description="MRI/X-ray upload, 3D reconstruction, injury detection, dashboards"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(prediction_router)
app.include_router(xray_router)
app.mount(
    "/heatmaps",
    StaticFiles(directory="backend/heatmaps"),
    name="heatmaps"
)

@app.get("/")
def root():
    return {"message": "InsightX Diagnosis API is running!"}
# app.include_router(patient_router, prefix="/patients", tags=["Patients"])
# app.include_router(scan_router, prefix="/scans", tags=["Scans"])
# app.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
