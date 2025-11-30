from fastapi import FastAPI
from app.database import Base, engine
from app.routers.patient_router import router as patient_router
from app.routers.scan_router import router as scan_router
from app.routers.dashboard_router import router as dashboard_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Medical Imaging System",
    description="MRI/X-ray upload, 3D reconstruction, injury detection, dashboards"
)

app.include_router(patient_router, prefix="/patients", tags=["Patients"])
app.include_router(scan_router, prefix="/scans", tags=["Scans"])
app.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
