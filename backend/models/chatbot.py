import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types

# 1. Setup the router
router = APIRouter()

# 2. Load keys and Client (Same as before)
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

if not api_key:
    print("Warning: GEMINI_API_KEY not found") # Good to warn rather than crash on import

client = genai.Client(api_key=api_key)

# 3. Define the data model
class ChatRequest(BaseModel):
    message: str

# 4. Implementing Strict Healthcare Guidelines
healthcare_instruction = """
You are a specialized Healthcare Assistant. Your role is to provide accurate, helpful information about health, medicine, and wellness.

STRICT RULES:
1. You MUST ONLY answer questions related to healthcare, anatomy, diseases, treatments, wellness, and medical administration.
2. If a user asks about anything else (like coding, sports, movies, or general small talk unrelated to health), you must politely REFUSE.
3. Standard Refusal Message: "I apologize, but I am a specialized healthcare assistant and can only help with medical or health-related inquiries."
4. Do not provide medical diagnoses. Always advise the user to consult a real doctor for serious conditions.
"""

# 4. Create the route
@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=request.message,
            config=types.GenerateContentConfig(
                system_instruction=healthcare_instruction,  
                temperature=0.3 
            )
        )
        return {"reply": response.text}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))