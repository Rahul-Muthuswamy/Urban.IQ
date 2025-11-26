# RAG Service

This is the FastAPI service that handles RAG (Retrieval-Augmented Generation) queries for the AI Assistant chatbot.

## Prerequisites

1. Python 3.11+ with virtual environment activated
2. All dependencies installed from `requirements.txt`
3. Environment variables configured (see `.env` file):
   - `COSMOS_MONGO_URI` - MongoDB connection string
   - `COSMOS_DB_NAME` - Database name (default: "ragdb")
   - `COSMOS_COLLECTION` - Collection name (default: "election_docs")
   - `AZURE_OPENAI_EMBEDDINGS_API_KEY` - Azure OpenAI embeddings API key
   - `AZURE_OPENAI_EMBEDDINGS_ENDPOINT` - Azure OpenAI embeddings endpoint
   - `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` - Embedding deployment name
   - `AZURE_OPENAI_API_KEY` - Azure OpenAI API key
   - `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint
   - `AZURE_OPENAI_DEPLOYMENT` - Chat deployment name

## Starting the Service

### Windows:
```bash
cd backend
start_rag_service.bat
```

### Linux/Mac:
```bash
cd backend
chmod +x start_rag_service.sh
./start_rag_service.sh
```

### Manual Start:
```bash
cd backend/threaddit/rag
python start_rag_service.py
```

The service will start on `http://127.0.0.1:8000`

## API Endpoints

- `GET /` - API information
- `GET /ping` - Health check
- `GET /health` - Detailed health status
- `POST /rag` - Submit a query for RAG processing
- `GET /docs` - Interactive API documentation (Swagger UI)

## Testing

Once the service is running, you can test it:

```bash
curl http://127.0.0.1:8000/ping
```

Or visit `http://127.0.0.1:8000/docs` in your browser for interactive API documentation.

## Troubleshooting

1. **Service won't start**: Check that all environment variables are set
2. **Connection errors**: Verify MongoDB connection string is correct
3. **OpenAI errors**: Check Azure OpenAI credentials and deployment names
4. **Port already in use**: Make sure port 8000 is not being used by another service








