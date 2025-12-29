from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.models.chatbot import router as chatbot_router
from backend.routes.predict import router as prediction_router
from backend.routes.predict_xray import router as xray_router

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


@app.get("/")
async def root():
    return {"message": "Server is running. Use /chat to talk to Gemini."}
