# rag_retriever.py
import os
import numpy as np
import logging
from dotenv import load_dotenv
from pymongo import MongoClient
from openai import AzureOpenAI, OpenAIError
from typing import List, Dict, Any, Optional
from functools import lru_cache

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# --------------------------
# Cosmos Mongo Configuration
# --------------------------
COSMOS_URI = os.getenv("COSMOS_MONGO_URI")
DB_NAME = os.getenv("COSMOS_DB_NAME", "ragdb")
COLLECTION_NAME = os.getenv("COSMOS_COLLECTION", "election_docs")

if not COSMOS_URI:
    raise ValueError("COSMOS_MONGO_URI environment variable is required")

try:
    mongo_client = MongoClient(COSMOS_URI, serverSelectionTimeoutMS=5000)
    # Test connection
    mongo_client.admin.command('ismaster')
    db = mongo_client[DB_NAME]
    collection = db[COLLECTION_NAME]
    logger.info(f"Connected to MongoDB: {DB_NAME}.{COLLECTION_NAME}")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    raise

# --------------------------
# Azure OpenAI Clients
# --------------------------

# Validate required environment variables
required_vars = [
    "AZURE_OPENAI_EMBEDDINGS_API_KEY",
    "AZURE_OPENAI_EMBEDDINGS_ENDPOINT", 
    "AZURE_OPENAI_EMBEDDING_DEPLOYMENT",
    "AZURE_OPENAI_API_KEY",
    "AZURE_OPENAI_ENDPOINT",
    "AZURE_OPENAI_DEPLOYMENT"
]

for var in required_vars:
    if not os.getenv(var):
        raise ValueError(f"{var} environment variable is required")

# Embeddings client
try:
    embedding_client = AzureOpenAI(
        api_key=os.getenv("AZURE_OPENAI_EMBEDDINGS_API_KEY"),
        azure_endpoint=os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT"),
        api_version=os.getenv("AZURE_OPENAI_EMBEDDINGS_API_VERSION", "2024-02-01")
    )
    EMBED_MODEL = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")
    logger.info(f"Embedding client initialized with model: {EMBED_MODEL}")
except Exception as e:
    logger.error(f"Failed to initialize embedding client: {e}")
    raise

# Chat completion client
try:
    chat_client = AzureOpenAI(
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01")
    )
    CHAT_MODEL = os.getenv("AZURE_OPENAI_DEPLOYMENT")
    logger.info(f"Chat client initialized with model: {CHAT_MODEL}")
except Exception as e:
    logger.error(f"Failed to initialize chat client: {e}")
    raise


# --------------------------
# Helper Functions
# --------------------------
@lru_cache(maxsize=1000)
def embed_text(text: str) -> List[float]:
    """Generate embedding for a query or text chunk with caching."""
    if not text or not text.strip():
        raise ValueError("Text cannot be empty")
    
    try:
        resp = embedding_client.embeddings.create(
            input=text.strip(),
            model=EMBED_MODEL
        )
        return resp.data[0].embedding
    except OpenAIError as e:
        logger.error(f"OpenAI API error in embed_text: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in embed_text: {e}")
        raise


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    a, b = np.array(a), np.array(b)
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


# --------------------------
# Top-K Retriever
# --------------------------
def retrieve_top_k(query: str, k: int = 3) -> List[Dict[str, Any]]:
    """Retrieve top-k most relevant chunks from CosmosDB using optimized vector search."""
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")
    
    if k <= 0:
        raise ValueError("k must be positive")
    
    try:
        q_emb = embed_text(query)
        logger.info(f"Searching for top-{k} documents for query: {query[:50]}...")
        
        # Try vector search first (if available), fallback to manual similarity
        try:
            # MongoDB Atlas Vector Search (if configured)
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": "vector_index",
                        "path": "embedding", 
                        "queryVector": q_emb,
                        "numCandidates": min(k * 10, 1000),
                        "limit": k
                    }
                },
                {
                    "$project": {
                        "id": 1,
                        "source": 1,
                        "text": 1,
                        "chunk_index": 1,
                        "total_chunks": 1,
                        "score": {"$meta": "vectorSearchScore"}
                    }
                }
            ]
            
            results = list(collection.aggregate(pipeline))
            if results:
                logger.info(f"Vector search returned {len(results)} results")
                return results
        except Exception as ve:
            logger.warning(f"Vector search failed, falling back to manual similarity: {ve}")
        
        # Fallback to manual cosine similarity
        docs = collection.find(
            {"embedding": {"$exists": True}},
            {"id": 1, "source": 1, "text": 1, "chunk_index": 1, "total_chunks": 1, "embedding": 1}
        ).limit(10000)  # Limit to prevent memory issues
        
        scored = []
        for d in docs:
            emb = d.get("embedding")
            if not emb or len(emb) != len(q_emb):
                continue

            score = cosine_similarity(q_emb, emb)
            scored.append({
                "id": d["id"],
                "source": d["source"],
                "text": d["text"],
                "chunk_index": d.get("chunk_index"),
                "total_chunks": d.get("total_chunks"),
                "score": score
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        results = scored[:k]
        logger.info(f"Manual search returned {len(results)} results")
        return results
        
    except Exception as e:
        logger.error(f"Error in retrieve_top_k: {e}")
        raise


# --------------------------
# Build Prompt Context
# --------------------------
def build_context(chunks: List[Dict[str, Any]]) -> str:
    parts = []
    for c in chunks:
        header = f"[source: {c['source']} chunk: {c['id']} score:{c['score']:.4f}]"
        parts.append(header + "\n" + c["text"])
    return "\n\n---\n\n".join(parts)


# --------------------------
# Main RAG function
# --------------------------
def ask_rag(query: str, k: int = 3) -> Dict[str, Any]:
    """Main RAG function with comprehensive error handling."""
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")
    
    try:
        logger.info(f"Processing RAG query: {query[:100]}...")
        retrieved = retrieve_top_k(query, k=k)

        if not retrieved:
            logger.warning("No relevant documents found")
            return {
                "answer": "No relevant information found for your query.", 
                "retrieved": [],
                "status": "no_results"
            }

        context = build_context(retrieved)
        logger.info(f"Built context from {len(retrieved)} documents")

        system_prompt = (
            "You are a warm, cheerful assistant who explains things in simple, everyday language so anyone can understand — even people who may not be familiar with elections or technical terms. "
            "Keep your answers short, clear, and friendly. Avoid complicated words or long sentences. "
            "Always be patient, positive, and supportive. "
            ""
            "Use only the information provided in the context to answer the question. "
            "If the context does not contain the answer, say so politely and let the user know you're happy to help with another question. "
            ""
            "Your goal is to make every user feel welcome, comfortable, and understood."
        )
        user_prompt = f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer precisely based on the context:"

        try:
            resp = chat_client.chat.completions.create(
                model=CHAT_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
                max_tokens=800,
                timeout=30
            )

            answer = resp.choices[0].message.content
            logger.info("Successfully generated response")

            return {
                "answer": answer,
                "retrieved": retrieved,
                "status": "success",
                "context_length": len(context)
            }
            
        except OpenAIError as e:
            logger.error(f"OpenAI API error: {e}")
            return {
                "answer": "Sorry, I encountered an error while generating the response. Please try again.",
                "retrieved": retrieved,
                "status": "openai_error",
                "error": str(e)
            }
            
    except Exception as e:
        logger.error(f"Unexpected error in ask_rag: {e}")
        return {
            "answer": "An unexpected error occurred. Please try again.",
            "retrieved": [],
            "status": "error",
            "error": str(e)
        }
