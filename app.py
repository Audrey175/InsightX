from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.models.chatbot import router as chatbot_router
# #from backend.data import Base, engine
# from backend.routes.patient_router import router as patient_router
from backend.routes.scan_router import router as scan_router
# from backend.routes.dashboard import router as dashboard_router
# from backend.routes.chatbot import router as chatbot_router


# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Medical Imaging System",
    description="MRI/X-ray upload, 3D reconstruction, injury detection, dashboards"
)
# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# app.include_router(patient_router, prefix="/patients", tags=["Patients"])
# app.include_router(scan_router, prefix="/scans", tags=["Scans"])
# app.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
# app.include_router(chatbot_router, prefix="/api/chatbot")
app.include_router(scan_router, tags=["Scan"])
app.include_router(chatbot_router, prefix="/api/chatbot", tags=["Chatbot"])

# Root check
@app.get("/")
def read_root():
    return {"message": "Server is running. Use /chat to talk to Gemini."}