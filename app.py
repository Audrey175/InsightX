from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
# from app.database import Base, engine
# from app.routers.patient_router import router as patient_router
# from app.routers.scan_router import router as scan_router
# from app.routers.dashboard_router import router as dashboard_router
from fastapi.staticfiles import StaticFiles
from backend.modules.mri_service import analyze_dicom_zip
from fastapi.middleware.cors import CORSMiddleware
from backend.models.chatbot import router as chatbot_router
from backend.routes.predict import router as prediction_router
from backend.routes.predict_xray import router as xray_router

app = FastAPI()

# CORS so your frontend (Vite) can talk to this backend
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
from backend.routes.predict_mri import router as mri_router

app.include_router(mri_router)

app.mount(
    "/static",
    StaticFiles(directory="backend/static"),
    name="static"
)

app.mount("/outputs", StaticFiles(directory="backend/heatmaps"), name="outputs")

# Include the chatbot routes (the ones using Gemini)
app.include_router(chatbot_router)
app.include_router(prediction_router)
app.include_router(xray_router)

@app.get("/")
async def root():
    return {"message": "Server is running. Use /chat to talk to Gemini."}
