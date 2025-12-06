# backend/chatbot/embeddings/embedder.py
from typing import List
from ..config import EMBEDDING_MODEL

def call_embedding_api(texts: List[str]) -> List[List[float]]:
    """
    TODO: Implement this with Vertex AI embeddings or another embedding provider.
    Example: using Vertex AI client to create embeddings or Google Generative AI embeddings.
    Should return list of float vectors.
    """
    # Example placeholder - raise so you don't forget
    raise NotImplementedError("Implement call_embedding_api using Vertex AI or other provider")

def create_embeddings_for_chunks(chunks: List[str]) -> List[List[float]]:
    # small wrapper for any post-processing you might need
    return call_embedding_api(chunks)
