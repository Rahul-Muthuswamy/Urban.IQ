import os
import numpy as np
import logging
from dotenv import load_dotenv
from pymongo import MongoClient
from openai import AzureOpenAI, OpenAIError
from typing import List, Dict, Any, Optional
from functools import lru_cache
import time
import hashlib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

COSMOS_URI = os.getenv("COSMOS_MONGO_URI")
DB_NAME = os.getenv("COSMOS_DB_NAME", "ragdb")
COLLECTION_NAME = os.getenv("COSMOS_COLLECTION", "election_docs")

if not COSMOS_URI:
    raise ValueError("COSMOS_MONGO_URI environment variable is required")

try:
    mongo_client = MongoClient(
        COSMOS_URI, 
        serverSelectionTimeoutMS=10000,
        connectTimeoutMS=10000,
        socketTimeoutMS=30000,
        maxPoolSize=10,
        retryWrites=False  
    )
    mongo_client.admin.command('ismaster')
    db = mongo_client[DB_NAME]
    collection = db[COLLECTION_NAME]
    logger.info(f"Connected to MongoDB: {DB_NAME}.{COLLECTION_NAME}")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    raise

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

_query_cache = {}
_cache_max_age = 300 

def _get_query_cache_key(query: str, k: int) -> str:
    return hashlib.md5(f"{query.strip().lower()}_{k}".encode()).hexdigest()

def _get_cached_result(query: str, k: int) -> Optional[List[Dict[str, Any]]]:
    cache_key = _get_query_cache_key(query, k)
    if cache_key in _query_cache:
        cached_data, timestamp = _query_cache[cache_key]
        if time.time() - timestamp < _cache_max_age:
            logger.info("Returning cached result")
            return cached_data
        else:
            del _query_cache[cache_key]
    return None

def _cache_result(query: str, k: int, result: List[Dict[str, Any]]) -> None:
    cache_key = _get_query_cache_key(query, k)
    _query_cache[cache_key] = (result, time.time())
    
    if len(_query_cache) > 20:
        oldest_key = min(_query_cache.keys(), key=lambda k: _query_cache[k][1])
        del _query_cache[oldest_key]

def check_database_status() -> Dict[str, Any]:
    try:
        mongo_client.admin.command('ismaster')
        
        total_docs = collection.count_documents({})
        docs_with_embeddings = collection.count_documents({"embedding": {"$exists": True}})
        
        sample_doc = collection.find_one({"embedding": {"$exists": True}})
        embedding_dimension = len(sample_doc["embedding"]) if sample_doc and "embedding" in sample_doc else 0
        
        return {
            "status": "connected",
            "total_documents": total_docs,
            "documents_with_embeddings": docs_with_embeddings,
            "embedding_dimension": embedding_dimension,
            "database": DB_NAME,
            "collection": COLLECTION_NAME
        }
    except Exception as e:
        logger.error(f"Database status check failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "database": DB_NAME,
            "collection": COLLECTION_NAME
        }


@lru_cache(maxsize=1000)
def embed_text(text: str) -> List[float]:
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
    try:
        if not a or not b or len(a) != len(b):
            return 0.0
        
        a_arr, b_arr = np.array(a, dtype=np.float32), np.array(b, dtype=np.float32)
        
        norm_a, norm_b = np.linalg.norm(a_arr), np.linalg.norm(b_arr)
        if norm_a == 0 or norm_b == 0 or np.isnan(norm_a) or np.isnan(norm_b):
            return 0.0
        
        similarity = np.dot(a_arr, b_arr) / (norm_a * norm_b)
        
        if np.isnan(similarity) or np.isinf(similarity):
            return 0.0
        
        return float(np.clip(similarity, -1.0, 1.0))  
        
    except Exception as e:
        logger.warning(f"Error computing cosine similarity: {e}")
        return 0.0


def retrieve_top_k(query: str, k: int = 3) -> List[Dict[str, Any]]:
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")
    
    if k <= 0:
        raise ValueError("k must be positive")
    
    cached_result = _get_cached_result(query, k)
    if cached_result is not None:
        return cached_result
    
    try:
        q_emb = embed_text(query)
        logger.info(f"Searching for top-{k} documents for query: {query[:50]}...")
        
        vector_search_available = False
        try:
            test_pipeline = [{"$vectorSearch": {"index": "test", "path": "test", "queryVector": [0.1, 0.1], "numCandidates": 1, "limit": 1}}]
            list(collection.aggregate(test_pipeline, allowDiskUse=True))
            vector_search_available = True
        except Exception:
            logger.info("Vector search not available, using manual similarity calculation")
        
        if vector_search_available:
            try:
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
                logger.warning(f"Vector search failed: {ve}")
        
        try:
            results = _manual_similarity_search(q_emb, k, query)
            if results:
                _cache_result(query, k, results)
            return results
        except Exception as manual_error:
            logger.error(f"Manual similarity search also failed: {manual_error}")
            return []
        
    except Exception as e:
        logger.error(f"Error in retrieve_top_k: {e}")
        return []


def _manual_similarity_search(q_emb: List[float], k: int, query: str) -> List[Dict[str, Any]]:
    logger.info("Using manual similarity calculation for document retrieval")
    
    try:
        batch_size = 150  
        max_docs = 1500   
        all_scored = []
        processed_count = 0
        
        query_words = set(query.lower().split())
        filter_query = {"embedding": {"$exists": True}}
        
        voting_keywords = ["vote", "voting", "ballot", "election", "poll"]
        id_keywords = ["id", "identification", "proof", "document", "license"]
        
        if any(word in query.lower() for word in voting_keywords):
            cursor1 = collection.find(
                {"embedding": {"$exists": True}, "text": {"$regex": "vote|voting|ballot|poll", "$options": "i"}},
                {"id": 1, "source": 1, "text": 1, "chunk_index": 1, "total_chunks": 1, "embedding": 1}
            ).limit(max_docs // 2).batch_size(batch_size)
            
            cursor2 = collection.find(
                {"embedding": {"$exists": True}, "text": {"$not": {"$regex": "vote|voting|ballot|poll", "$options": "i"}}},
                {"id": 1, "source": 1, "text": 1, "chunk_index": 1, "total_chunks": 1, "embedding": 1}
            ).limit(max_docs // 2).batch_size(batch_size)
            
            all_cursors = [cursor1, cursor2]
        elif any(word in query.lower() for word in id_keywords):
            cursor1 = collection.find(
                {"embedding": {"$exists": True}, "text": {"$regex": "id|identification|proof|document|license", "$options": "i"}},
                {"id": 1, "source": 1, "text": 1, "chunk_index": 1, "total_chunks": 1, "embedding": 1}
            ).limit(max_docs // 2).batch_size(batch_size)
            
            cursor2 = collection.find(
                {"embedding": {"$exists": True}, "text": {"$not": {"$regex": "id|identification|proof|document|license", "$options": "i"}}},
                {"id": 1, "source": 1, "text": 1, "chunk_index": 1, "total_chunks": 1, "embedding": 1}
            ).limit(max_docs // 2).batch_size(batch_size)
            
            all_cursors = [cursor1, cursor2]
        else:
            all_cursors = [collection.find(
                filter_query,
                {"id": 1, "source": 1, "text": 1, "chunk_index": 1, "total_chunks": 1, "embedding": 1}
            ).limit(max_docs).batch_size(batch_size)]
        
        docs_batch = []
        for cursor in all_cursors:
            try:
                for doc in cursor:
                    docs_batch.append(doc)
                    
                    if len(docs_batch) >= batch_size:
                        try:
                            batch_scores = _process_document_batch(docs_batch, q_emb)
                            all_scored.extend(batch_scores)
                            processed_count += len(docs_batch)
                            
                            if len(all_scored) > k * 10:
                                all_scored.sort(key=lambda x: x["score"], reverse=True)
                                all_scored = all_scored[:k * 5]  
                            
                            docs_batch = []
                            
                            if processed_count % 500 == 0:
                                logger.info(f"Processed {processed_count} documents...")
                                
                        except Exception as e:
                            logger.warning(f"Error processing batch: {e}")
                            docs_batch = []  
                            continue
                            
                    if processed_count >= max_docs:
                        break
                        
            except Exception as cursor_error:
                logger.warning(f"Cursor error: {cursor_error}")
                continue
            
            if processed_count >= max_docs:
                break
        
        if docs_batch:
            try:
                batch_scores = _process_document_batch(docs_batch, q_emb)
                all_scored.extend(batch_scores)
                processed_count += len(docs_batch)
            except Exception as e:
                logger.warning(f"Error processing final batch: {e}")
        
        if not all_scored:
            logger.warning("No documents processed successfully")
            return []
        
        all_scored.sort(key=lambda x: x["score"], reverse=True)
        results = all_scored[:k]
        
        logger.info(f"Manual search processed {processed_count} documents, returned {len(results)} results")
        return results
        
    except Exception as e:
        logger.error(f"Error in manual similarity search: {e}")
        return []


def _process_document_batch(batch: List[Dict], q_emb: List[float]) -> List[Dict[str, Any]]:
    scored = []
    
    for doc in batch:
        emb = doc.get("embedding")
        if not emb or len(emb) != len(q_emb):
            continue
        
        score = cosine_similarity(q_emb, emb)
        scored.append({
            "id": doc["id"],
            "source": doc["source"],
            "text": doc["text"],
            "chunk_index": doc.get("chunk_index"),
            "total_chunks": doc.get("total_chunks"),
            "score": score
        })
    
    return scored


def build_context(chunks: List[Dict[str, Any]]) -> str:
    parts = []
    for c in chunks:
        header = f"[source: {c['source']} chunk: {c['id']} score:{c['score']:.4f}]"
        parts.append(header + "\n" + c["text"])
    return "\n\n---\n\n".join(parts)


def ask_rag(query: str, k: int = 3) -> Dict[str, Any]:
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

        system_prompt = """You are a warm and cheerful assistant who explains things in simple, everyday language so everyone can understand — even people who may not be familiar with elections or technical terms.

How you communicate:
- Keep answers short, clear, and friendly.
- Avoid complicated words or long sentences.
- Always stay patient, positive, and supportive.

Rules:
- Use only the information provided in the context to answer questions.
- If the context does not contain the answer, politely say you don't know and let the user know you're happy to help with another question.

Goal:
Make every user feel welcome, comfortable, and understood."""
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
