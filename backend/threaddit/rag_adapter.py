"""
RAG Adapter - Thin wrapper to call the external RAG service.
This adapter handles HTTP communication with the RAG service running at http://127.0.0.1:8000
"""
import requests
import logging
from typing import Dict, Optional, Any
from threaddit.chatbot.config import RAG_SERVICE_URL, RAG_SERVICE_TIMEOUT

logger = logging.getLogger(__name__)


class RAGServiceError(Exception):
    """Custom exception for RAG service errors."""
    pass


def rag_query(query: str, k: int = 5, user_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Query the RAG service and return answer with sources.
    
    Args:
        query: The user's query string
        k: Number of documents to retrieve (default: 5)
        user_id: Optional user ID for logging (not stored)
    
    Returns:
        Dictionary with keys:
            - answer: str - The generated answer
            - sources: list - List of source documents with title, snippet, url
            - status: str - Status of the query
            - retrieved: list - Raw retrieved documents (optional)
    
    Raises:
        RAGServiceError: If the service is unavailable or returns an error
        ValueError: If query is invalid
    """
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")
    
    if k < 1 or k > 20:
        raise ValueError("k must be between 1 and 20")
    
    try:
        # Prepare request payload
        payload = {
            "query": query.strip(),
            "k": k
        }
        
        logger.info(f"Calling RAG service: query='{query[:50]}...', k={k}, user_id={user_id}")
        
        # Make HTTP request to RAG service
        response = requests.post(
            RAG_SERVICE_URL,
            json=payload,
            timeout=RAG_SERVICE_TIMEOUT,
            headers={"Content-Type": "application/json"}
        )
        
        # Check HTTP status
        response.raise_for_status()
        
        # Parse response
        result = response.json()
        
        # Extract answer
        answer = result.get("answer", "No answer available.")
        
        # Extract sources from retrieved documents
        sources = []
        retrieved = result.get("retrieved", [])
        
        for doc in retrieved:
            source = {
                "title": doc.get("source", "Unknown Source"),
                "snippet": doc.get("text", "")[:200] + "..." if len(doc.get("text", "")) > 200 else doc.get("text", ""),
                "url": None,  # RAG service doesn't provide URLs, but we can construct if needed
                "score": doc.get("score", 0.0) if "score" in doc else None
            }
            sources.append(source)
        
        # Return standardized format
        return {
            "answer": answer,
            "sources": sources,
            "status": result.get("status", "success"),
            "retrieved": retrieved  # Include raw for debugging
        }
        
    except requests.exceptions.Timeout:
        logger.error(f"RAG service timeout after {RAG_SERVICE_TIMEOUT}s")
        raise RAGServiceError("RAG service timed out. Please try again later.")
    
    except requests.exceptions.ConnectionError:
        logger.error("RAG service connection error - service may be down")
        raise RAGServiceError("RAG service is currently unavailable. Please try again later.")
    
    except requests.exceptions.HTTPError as e:
        logger.error(f"RAG service HTTP error: {e.response.status_code} - {e.response.text}")
        if e.response.status_code == 400:
            error_detail = e.response.json().get("detail", "Invalid request")
            raise RAGServiceError(f"Invalid query: {error_detail}")
        raise RAGServiceError(f"RAG service error: {e.response.status_code}")
    
    except requests.exceptions.RequestException as e:
        logger.error(f"RAG service request error: {str(e)}")
        raise RAGServiceError(f"Error communicating with RAG service: {str(e)}")
    
    except Exception as e:
        logger.error(f"Unexpected error in RAG adapter: {str(e)}")
        raise RAGServiceError(f"Unexpected error: {str(e)}")



