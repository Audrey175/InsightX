# backend/chatbot/loaders/file_loader.py
import os
from typing import List
from pathlib import Path
import uuid

def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    chunks = []
    start = 0
    length = len(text)
    while start < length:
        end = min(start + chunk_size, length)
        chunk = text[start:end]
        chunks.append(chunk)
        start = max(end - overlap, end)
    return chunks

def load_text_file(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def ingest_text_file_to_vector_store(path: str, embed_fn, add_fn):
    text = load_text_file(path)
    chunks = chunk_text(text)
    docs = []
    embeddings = embed_fn(chunks)
    for i, chunk in enumerate(chunks):
        doc = {
            "id": f"{Path(path).stem}_{i}_{uuid.uuid4().hex[:8]}",
            "text": chunk,
            "embedding": embeddings[i]
        }
        docs.append(doc)
    add_fn(docs)
