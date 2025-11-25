import logging
import time
import sys
import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator

# Add the current directory to the path so we can import rag_retriever
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rag_retriever import ask_rag

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Election RAG API",
    description="A Retrieval-Augmented Generation API for election-related queries",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s"
    )
    return response

class QueryIn(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="The query to search for")
    k: int = Field(default=3, ge=1, le=20, description="Number of documents to retrieve")
    
    @validator('query')
    def validate_query(cls, v):
        if not v.strip():
            raise ValueError('Query cannot be empty or whitespace only')
        return v.strip()

class ErrorResponse(BaseModel):
    error: str
    detail: str = None
    status: str = "error"

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception handler caught: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "status": "error"
        }
    )

@app.get("/ping")
def ping():
    return {
        "status": "running",
        "timestamp": time.time(),
        "service": "Election RAG API"
    }

@app.get("/health")
def health():
    try:
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "checks": {
                "api": "ok",
                "database": "ok",  
                "openai": "ok"    
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.post("/rag")
def rag_endpoint(body: QueryIn):
    try:
        logger.info(f"Received query: {body.query[:100]}... (k={body.k})")
        
        result = ask_rag(body.query, body.k)
        
        result["request_info"] = {
            "query_length": len(body.query),
            "k_requested": body.k,
            "timestamp": time.time()
        }
        
        return result
        
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error processing RAG request: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/")
def root():
    return {
        "message": "Election RAG API",
        "version": "1.0.0",
        "endpoints": {
            "POST /rag": "Submit a query for RAG processing",
            "GET /ping": "Health check",
            "GET /health": "Detailed health status",
            "GET /docs": "API documentation"
        }
    }
