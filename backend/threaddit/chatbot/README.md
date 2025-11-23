# Chatbot Module - RAG Integration

This module integrates the external RAG (Retrieval-Augmented Generation) service into the Threaddit application as a user-facing AI Assistant.

## Overview

The chatbot provides an AI-powered Q&A interface that queries a standalone RAG service running at `http://127.0.0.1:8000`. The integration includes:

- Content safety filtering (PII detection, illegal instructions)
- Rate limiting (in-memory, TODO: replace with Redis)
- Political content detection
- Source sanitization
- Analytics (counters only, no chat history stored)

## Architecture

### Components

1. **RAG Adapter** (`backend/threaddit/rag_adapter.py`)
   - Thin HTTP wrapper to call the RAG service
   - Handles timeouts, connection errors, and response parsing
   - Returns standardized format: `{"answer": str, "sources": list}`

2. **Chatbot Routes** (`backend/threaddit/chatbot/routes.py`)
   - `POST /api/chat/query` - Main query endpoint
   - `POST /api/chat/feedback` - Feedback endpoint (auth required)
   - `GET /api/chat/analytics/summary` - Analytics (mod/admin only)

3. **Configuration** (`backend/threaddit/chatbot/config.py`)
   - Political keywords
   - PII patterns
   - Illegal instruction patterns
   - Rate limit settings
   - RAG service URL

## RAG Service Integration

### Current Setup

The adapter calls the RAG service via HTTP POST:

```python
POST http://127.0.0.1:8000/rag
Body: {"query": "user question", "k": 5}
Response: {"answer": "...", "retrieved": [...], "status": "..."}
```

### Switching to Direct Module Import

If you want to use the RAG module directly instead of HTTP:

1. **Option 1: Import the function directly**

   Modify `backend/threaddit/rag_adapter.py`:

   ```python
   # Instead of HTTP call, import directly
   import sys
   import os
   sys.path.append(os.path.join(os.path.dirname(__file__), '../../rag'))
   from rag_retriever import ask_rag
   
   def rag_query(query: str, k: int = 5, user_id: Optional[int] = None) -> Dict[str, Any]:
       result = ask_rag(query, k)
       # Transform to standardized format
       return {
           "answer": result.get("answer", ""),
           "sources": [...],  # Transform retrieved docs
           "status": result.get("status", "success")
       }
   ```

2. **Option 2: Keep HTTP but change URL**

   Update `RAG_SERVICE_URL` in `backend/threaddit/chatbot/config.py`:

   ```python
   RAG_SERVICE_URL = "http://your-rag-service:8000/rag"
   ```

### Environment Variables

The RAG service requires these environment variables (configured in `rag/` directory):

- `COSMOS_MONGO_URI` - MongoDB connection string
- `COSMOS_DB_NAME` - Database name
- `AZURE_OPENAI_EMBEDDINGS_API_KEY` - Embeddings API key
- `AZURE_OPENAI_EMBEDDINGS_ENDPOINT` - Embeddings endpoint
- `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` - Embedding model name
- `AZURE_OPENAI_API_KEY` - Chat API key
- `AZURE_OPENAI_ENDPOINT` - Chat endpoint
- `AZURE_OPENAI_DEPLOYMENT` - Chat model name

**Note:** These are configured in the `rag/` service, not in the main Flask app.

## Rate Limiting

### Current Implementation

Uses in-memory dictionaries with per-IP and per-user counters.

**Limits:**
- IP-based: 10 requests/minute
- User-based: 20 requests/minute

### Production Migration

Replace with Flask-Limiter or Redis:

1. **Install Flask-Limiter:**
   ```bash
   pip install flask-limiter
   ```

2. **Update `backend/threaddit/chatbot/routes.py`:**
   ```python
   from flask_limiter import Limiter
   from flask_limiter.util import get_remote_address
   
   limiter = Limiter(
       app=app,
       key_func=lambda: current_user.id if current_user.is_authenticated else get_remote_address(),
       default_limits=["20 per minute"]
   )
   
   @chatbot.route("/query", methods=["POST"])
   @limiter.limit("10 per minute", key_func=lambda: request.remote_addr)
   @limiter.limit("20 per minute", key_func=lambda: current_user.id if current_user.is_authenticated else None)
   def query():
       ...
   ```

3. **Or use Redis:**
   ```python
   from flask_limiter import Limiter
   from flask_limiter.util import get_remote_address
   import redis
   
   redis_client = redis.Redis(host='localhost', port=6379, db=0)
   limiter = Limiter(
       app=app,
       storage_uri="redis://localhost:6379",
       key_func=lambda: current_user.id if current_user.is_authenticated else get_remote_address()
   )
   ```

## Adding Persistent Chat History

Currently, chat history is **NOT stored**. To add persistent logging:

### Step 1: Create Database Table

Add to `backend/schema.sql`:

```sql
---------------------------------------------------------
-- CHAT HISTORY (Optional - for persistent logging)
---------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.chat_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    ip_address INET,
    query TEXT NOT NULL,
    answer TEXT NOT NULL,
    sources JSONB,
    is_political BOOLEAN DEFAULT FALSE,
    response_time_ms FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON public.chat_history(created_at);
```

### Step 2: Create Model

Create `backend/threaddit/chatbot/models.py`:

```python
from threaddit import db

class ChatHistory(db.Model):
    __tablename__ = "chat_history"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    ip_address = db.Column(db.String(45))  # IPv6 max length
    query = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)
    sources = db.Column(db.JSON)  # Store sources as JSON
    is_political = db.Column(db.Boolean, default=False)
    response_time_ms = db.Column(db.Float)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now())
    
    user = db.relationship("User", backref="chat_history")
```

### Step 3: Update Routes

Modify `backend/threaddit/chatbot/routes.py`:

```python
from threaddit.chatbot.models import ChatHistory

@chatbot.route("/query", methods=["POST"])
def query():
    # ... existing code ...
    
    # After successful query, store in database
    chat_entry = ChatHistory(
        user_id=user_id if current_user.is_authenticated else None,
        ip_address=request.remote_addr,
        query=query_text,
        answer=result.get("answer", ""),
        sources=sanitized_sources,
        is_political=is_political,
        response_time_ms=response_time_ms
    )
    db.session.add(chat_entry)
    db.session.commit()
    
    # ... rest of code ...
```

### Step 4: Add Analytics Endpoint

Add endpoint to query chat history:

```python
@chatbot.route("/history", methods=["GET"])
@login_required
def get_chat_history():
    """Get user's chat history (if enabled)."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    
    query = ChatHistory.query.filter_by(user_id=current_user.id)
    paginated = query.order_by(ChatHistory.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        "history": [h.to_dict() for h in paginated.items],
        "total": paginated.total,
        "page": page,
        "pages": paginated.pages
    })
```

## Analytics Counters

Current analytics store only counters (no chat text):

- Total requests (last 7 days)
- Blocked requests count
- Average response time
- Top query keywords
- Top sources hit
- Feedback counters

### Adding Database Analytics

To persist analytics counters:

```sql
CREATE TABLE IF NOT EXISTS public.chat_analytics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value INTEGER DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_analytics_date ON public.chat_analytics(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_analytics_metric_date ON public.chat_analytics(metric_name, date);
```

Then update `backend/threaddit/chatbot/routes.py` to increment counters in database instead of memory.

## Content Security Policy (CSP)

If embedding external source URLs, update CSP headers in `backend/threaddit/__init__.py`:

```python
@app.after_request
def set_csp_header(response):
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "connect-src 'self' http://127.0.0.1:8000; "  # Allow RAG service
        "frame-ancestors 'none';"
    )
    return response
```

## Testing

Run tests:

```bash
cd backend
pytest tests/test_chatbot.py -v
```

## Troubleshooting

### RAG Service Not Available

**Error:** `RAG service is currently unavailable`

**Solution:**
1. Ensure RAG service is running: `cd rag && python app_main.py` or `uvicorn app_main:app --host 127.0.0.1 --port 8000`
2. Check `RAG_SERVICE_URL` in `backend/threaddit/chatbot/config.py`
3. Verify network connectivity

### Rate Limit Issues

**Error:** `Rate limit exceeded`

**Solution:**
- Wait 1 minute or implement Redis-based rate limiting
- Adjust limits in `backend/threaddit/chatbot/config.py`

### Content Safety False Positives

If legitimate queries are being blocked:

1. Review patterns in `backend/threaddit/chatbot/config.py`
2. Adjust regex patterns to be more specific
3. Add exceptions for common false positives

## Security Notes

- **No PII Storage:** Chat queries and answers are NOT stored
- **Source Sanitization:** Sources containing sensitive keywords are redacted
- **Rate Limiting:** Prevents abuse
- **Content Filtering:** Blocks PII and illegal instructions
- **Political Advisory:** Warns users about political content

## Future Enhancements

- [ ] Replace in-memory rate limiting with Redis
- [ ] Add persistent chat history (optional)
- [ ] Add conversation context (multi-turn)
- [ ] Add user preferences (language, verbosity)
- [ ] Add source verification badges
- [ ] Add export functionality for chat history



