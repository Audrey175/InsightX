import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai

# 1. Setup the router
router = APIRouter()

# 2. Load keys and Client (Same as before)
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Warning: GEMINI_API_KEY not found") # Good to warn rather than crash on import

client = genai.Client(api_key=api_key)

# 3. Define the data model
class ChatRequest(BaseModel):
    message: str

# 4. Create the route
# Note: We use @router.post, NOT @app.post
@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=request.message
        )
        return {"reply": response.text}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))