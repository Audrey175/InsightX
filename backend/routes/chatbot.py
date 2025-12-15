# backend/chatbot/routes/chatbot_router.py
from fastapi import APIRouter, HTTPException
# from ..service.rag_service import answer_query
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(payload: ChatRequest):
    if not payload.message:
        raise HTTPException(status_code=400, detail="Empty message")
    reply = answer_query(payload.message)
    return {"reply": reply}
