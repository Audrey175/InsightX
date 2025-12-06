# backend/chatbot/service/rag_service.py
from ..embeddings.embedder import create_embeddings_for_chunks
from ..embeddings.vector_store import search_similar
from ..config import GENERATION_MODEL, TOP_K
from typing import List

def call_gemini_generate(prompt: str) -> str:
    """
    TODO: Implement this function using Vertex AI / Generative API to call Gemini.
    Two options:
      - Use google.generativeai or google-cloud-aiplatform client libraries
      - Use REST endpoint (with Bearer token from service account)
    Expected to return generated text (string).
    """
    raise NotImplementedError("Implement Gemini call here with your chosen Google client")

def build_prompt_from_context(query: str, contexts: List[str]) -> str:
    context_text = "\n\n---\n\n".join(contexts)
    prompt = f"""Below are reference documents from the knowledge base. Use ONLY these documents to answer the question. If the answer is not present, say you don't know rather than making things up.

Context:
{context_text}

Question:
{query}

Answer:"""
    return prompt

def answer_query(query: str) -> str:
    # 1) embed query
    q_emb = create_embeddings_for_chunks([query])[0]  # we reuse embedding fn for single text
    # 2) search
    results = search_similar(q_emb, k=TOP_K)
    contexts = [r["text"] for r in results]
    # 3) build prompt
    prompt = build_prompt_from_context(query, contexts)
    # 4) call Gemini to generate
    answer = call_gemini_generate(prompt)
    return answer
