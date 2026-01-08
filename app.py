from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.data.scan_database import init_db
from backend.routes import dashboard, scans, patient_router 
from backend.models.chatbot import router as chatbot_router
from backend.routes.health import router as health_router
from backend.routes.predict import router as prediction_router
from backend.routes.predict_xray import router as xray_router
from backend.routes.scans import router as scans_router

app = FastAPI()

# CORS so your frontend (Vite) can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the chatbot routes (the ones using Gemini)
app.include_router(chatbot_router)
app.include_router(prediction_router)
app.include_router(xray_router)
app.include_router(scans_router)
app.include_router(health_router)

app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(scans.router, prefix="/api/scans", tags=["Scans"])
app.include_router(patient_router.router, prefix="/api/patients", tags=["Patients"])

@app.on_event("startup")
def startup(): 
    init_db()


@app.get("/")
async def root():
    return {"message": "Server is running. Use /chat to talk to Gemini."}
