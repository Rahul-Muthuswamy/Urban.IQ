import os
import json
from openai import AzureOpenAI
from dotenv import load_dotenv
from pymongo import MongoClient
import re

load_dotenv()

# -----------------------------
# Cosmos DB (Mongo API) client
# -----------------------------
COSMOS_URI = os.getenv("COSMOS_MONGO_URI")      # from Connection Strings
DB_NAME = "ragdb"
COLLECTION_NAME = "election_docs"

mongo_client = MongoClient(COSMOS_URI)
db = mongo_client[DB_NAME]
collection = db[COLLECTION_NAME]

# -----------------------------
# Azure OpenAI client
# -----------------------------
openai_client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_EMBEDDINGS_API_KEY"),
    azure_endpoint=os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT"),
    api_version="2024-02-01"
)


# ----------------------------------------------------------
# TEXT EXTRACTION LOGIC (Supports ALL your election JSONs)
# ----------------------------------------------------------
def extract_text(data):
    # candidate_list.json
    if isinstance(data, list) and data and "candidates" in data[0]:
        lines = []
        for office in data:
            office_info = (
                f"Office: {office.get('office')} "
                f"District: {office.get('district')} "
                f"Jurisdiction: {office.get('jurisdiction')}"
            )
            lines.append(office_info)

            # Check if office has candidates
            if "candidates" in office and office["candidates"]:
                for c in office["candidates"]:
                    lines.append(
                        f"Candidate: {c['name']} | "
                        f"Parties: {', '.join(c.get('parties', []))} | "
                        f"Address: {c.get('address')}"
                    )

        return " ".join(lines)

    # faq.json
    if isinstance(data, list) and data and "question" in data[0]:
        return " ".join([f"Q: {q['question']} A: {q['answer']}" for q in data if "question" in q and "answer" in q])

    # impt_data.json
    if isinstance(data, dict) and data.get("type") == "election_dates":
        lines = [
            f"Election: {data['election_name']} on {data['election_date']} "
            f"in {data['jurisdiction']}"
        ]
        for item in data["items"]:
            lines.append(
                f"{item['title']}: {item['description']} | "
                f"Deadline: {item.get('deadline')} | "
                f"Start: {item.get('start_date')} | "
                f"End: {item.get('end_date')}"
            )
        return " ".join(lines)

    # proposal_one.json
    if isinstance(data, dict) and data.get("type") == "ballot_proposal":
        return (
            f"Proposal {data['proposal_number']}: {data['title']} "
            f"Summary: {data['summary_plain_language']} "
            f"YES means: {data['yes_vote_meaning']} "
            f"NO means: {data['no_vote_meaning']}"
        )

    return json.dumps(data)


# ----------------------------------------------------------
# TEXT CHUNKING — Split large texts into smaller chunks
# ----------------------------------------------------------
def chunk_text(text, max_length=6000):
    """Split text into chunks that fit within the embedding model's token limit."""
    if len(text) <= max_length:
        return [text]
    
    # Try to split on sentences first
    sentences = re.split(r'[.!?]+', text)
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
            
        # If adding this sentence would exceed the limit, start a new chunk
        if len(current_chunk) + len(sentence) + 1 > max_length:
            if current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = sentence
            else:
                # If a single sentence is too long, split it by words
                words = sentence.split()
                while words:
                    word_chunk = ""
                    while words and len(word_chunk) + len(words[0]) + 1 <= max_length:
                        word_chunk += " " + words.pop(0)
                    if word_chunk:
                        chunks.append(word_chunk.strip())
        else:
            current_chunk += " " + sentence
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks


# ----------------------------------------------------------
# MAIN FUNCTION — Upload all embeddings into Cosmos DB
# ----------------------------------------------------------
def process_and_upload():
    folder = "./docs"

    print("\n🚀 Starting embedding upload to CosmosDB...\n")

    for filename in os.listdir(folder):
        if not filename.endswith(".json"):
            continue

        full_path = os.path.join(folder, filename)

        print(f"📄 Reading: {full_path}")

        with open(full_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        text = extract_text(data)

        if not text.strip():
            print(f"⚠ Skipped empty: {filename}")
            continue

        # --- Split text into chunks if needed ---
        text_chunks = chunk_text(text)
        print(f"📝 Split into {len(text_chunks)} chunk(s)")

        # --- Process each chunk ---
        for i, chunk in enumerate(text_chunks):
            print(f"✨ Creating embedding for chunk {i+1}/{len(text_chunks)}...")
            
            embedding = openai_client.embeddings.create(
                input=chunk,
                model=os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")
            ).data[0].embedding

            # Create unique doc_id for each chunk
            base_id = filename.replace(".json", "")
            doc_id = f"{base_id}_{i}" if len(text_chunks) > 1 else base_id

            document = {
                "id": doc_id,            # IMPORTANT: must match shard key
                "source": filename,
                "text": chunk,
                "embedding": embedding,
                "chunk_index": i,
                "total_chunks": len(text_chunks)
            }

            # --- Upsert into Cosmos ---
            collection.update_one(
                {"id": doc_id},
                {"$set": document},
                upsert=True
            )

            print(f"✅ Saved: {doc_id}")

        print()

    print("\n🎉 ALL embeddings uploaded to Cosmos MongoDB successfully!\n")


if __name__ == "__main__":
    process_and_upload()
