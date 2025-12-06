# backend/chatbot/config.py
import os

# Google Cloud/Vertex AI / Gemini settings
GOOGLE_PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID", "your-project-id")
GOOGLE_LOCATION = os.getenv("GOOGLE_LOCATION", "us-central1")
# If using service account JSON file path, set env var:
# export GOOGLE_APPLICATION_CREDENTIALS="/path/to/sa.json"

# Embedding model choice (if using Vertex AI embeddings)
EMBEDDING_MODEL = "textembedding-gecko"  # replace as needed

# Generation model name (Gemini)
GENERATION_MODEL = "gemini-pro-1"  # replace with the exact model name you want

# Vector DB settings
VECTOR_DB_PATH = "./backend/chatbot/chroma_db"  # persistent path for Chroma
TOP_K = 3
