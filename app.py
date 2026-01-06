import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Import Routers
from backend.models.chatbot import router as chatbot_router
from backend.routes.predict import router as prediction_router
from backend.routes.predict_xray import router as xray_router  # Renamed for clarity
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
app.include_router(prediction_router, tags=["General Prediction"])
app.include_router(xray_router, tags=["X-Ray"])
app.include_router(mri_router, tags=["MRI"])
app.include_router(chatbot_router, prefix="/chat", tags=["Chatbot"])

# 3. Static Files (One mount per directory)
# Consolidating heatmaps/outputs to one mount point
app.mount("/static", StaticFiles(directory="backend/static"), name="static")
app.mount("/outputs", StaticFiles(directory="backend/heatmaps"), name="outputs")

@app.get("/")
async def root():
    return {"message": "InsightX Server is running."}