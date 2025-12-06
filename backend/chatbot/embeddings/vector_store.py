# backend/chatbot/embeddings/vector_store.py
import chromadb
from chromadb.config import Settings
from ..config import VECTOR_DB_PATH, TOP_K

# Create a persistent Chroma client
client = chromadb.Client(Settings(chroma_db_impl="duckdb+parquet", persist_directory=VECTOR_DB_PATH))

COLLECTION_NAME = "knowledge_base"

def get_collection():
    try:
        return client.get_collection(COLLECTION_NAME)
    except Exception:
        return client.create_collection(name=COLLECTION_NAME)

def add_documents(docs):
    """
    docs: list of dicts: [{"id": "doc1", "text": "....", "embedding": [..]}, ...]
    """
    col = get_collection()
    ids = [d["id"] for d in docs]
    documents = [d["text"] for d in docs]
    embeddings = [d["embedding"] for d in docs]
    col.add(ids=ids, documents=documents, embeddings=embeddings)
    client.persist()

def search_similar(embedding, k=TOP_K):
    col = get_collection()
    results = col.query(query_embeddings=[embedding], n_results=k, include=["documents", "metadatas", "distances"])
    # results structure: { "ids": [[...]], "documents":[[...]...], ...}
    # Return first list
    out = []
    docs = results.get("documents", [[]])[0]
    distances = results.get("distances", [[]])[0]
    ids = results.get("ids", [[]])[0]
    for idx, d in enumerate(docs):
        out.append({"id": ids[idx] if idx < len(ids) else None, "text": d, "distance": distances[idx] if idx < len(distances) else None})
    return out
