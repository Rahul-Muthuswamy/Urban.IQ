import os
import json
from openai import AzureOpenAI
from dotenv import load_dotenv
from pymongo import MongoClient
import re

load_dotenv()


COSMOS_URI = os.getenv("COSMOS_MONGO_URI")     
DB_NAME = "ragdb"
COLLECTION_NAME = "election_docs"

mongo_client = MongoClient(COSMOS_URI)
db = mongo_client[DB_NAME]
collection = db[COLLECTION_NAME]


openai_client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_EMBEDDINGS_API_KEY"),
    azure_endpoint=os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT"),
    api_version="2024-02-01"
)


def extract_text(data):
    if isinstance(data, list) and data and "candidates" in data[0]:
        lines = []
        for office in data:
            office_info = (
                f"Office: {office.get('office')} "
                f"District: {office.get('district')} "
                f"Jurisdiction: {office.get('jurisdiction')}"
            )
            lines.append(office_info)

            if "candidates" in office and office["candidates"]:
                for c in office["candidates"]:
                    lines.append(
                        f"Candidate: {c['name']} | "
                        f"Parties: {', '.join(c.get('parties', []))} | "
                        f"Address: {c.get('address')}"
                    )

        return " ".join(lines)

    if isinstance(data, list) and data and "question" in data[0]:
        return " ".join([f"Q: {q['question']} A: {q['answer']}" for q in data if "question" in q and "answer" in q])

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

    if isinstance(data, dict) and data.get("type") == "ballot_proposal":
        return (
            f"Proposal {data['proposal_number']}: {data['title']} "
            f"Summary: {data['summary_plain_language']} "
            f"YES means: {data['yes_vote_meaning']} "
            f"NO means: {data['no_vote_meaning']}"
        )

    if isinstance(data, list) and data and "site_name" in data[0]:
        lines = []
        for location in data:
            borough = location.get('borough', '').strip()
            site_name = location.get('site_name', '').strip()
            address = location.get('address', '').strip()
            zipcode = location.get('zipcode', '').strip()
            latitude = location.get('latitude', '').strip()
            longitude = location.get('longitude', '').strip()
            
            location_text = f"Polling Location: {site_name}"
            
            if address:
                location_text += f" | Address: {address}"
            
            if borough:
                location_text += f" | Borough: {borough}"
            
            if zipcode:
                location_text += f" | ZIP: {zipcode}"
            
            if latitude and longitude:
                location_text += f" | Coordinates: {latitude}, {longitude}"
            
            lines.append(location_text)
        
        return " ".join(lines)

    return json.dumps(data)

def chunk_text(text, max_length=6000):
    if len(text) <= max_length:
        return [text]
    
    sentences = re.split(r'[.!?]+', text)
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
            
        if len(current_chunk) + len(sentence) + 1 > max_length:
            if current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = sentence
            else:
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

def process_and_upload():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    folder = os.path.join(script_dir, "docs")

    print("\n Starting embedding upload to CosmosDB...\n")

    for filename in os.listdir(folder):
        if not filename.endswith(".json"):
            continue

        full_path = os.path.join(folder, filename)

        print(f" Reading: {full_path}")

        with open(full_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        text = extract_text(data)

        if not text.strip():
            print(f" Skipped empty: {filename}")
            continue

        text_chunks = chunk_text(text)
        print(f"📝 Split into {len(text_chunks)} chunk(s)")

        for i, chunk in enumerate(text_chunks):
            print(f"✨ Creating embedding for chunk {i+1}/{len(text_chunks)}...")
            
            embedding = openai_client.embeddings.create(
                input=chunk,
                model=os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")
            ).data[0].embedding

            base_id = filename.replace(".json", "")
            doc_id = f"{base_id}_{i}" if len(text_chunks) > 1 else base_id

            document = {
                "id": doc_id,           
                "source": filename,
                "text": chunk,
                "embedding": embedding,
                "chunk_index": i,
                "total_chunks": len(text_chunks)
            }

            collection.update_one(
                {"id": doc_id},
                {"$set": document},
                upsert=True
            )

            print(f"✅ Saved: {doc_id}")

        print()

    print("\nALL embeddings uploaded to Cosmos MongoDB successfully!\n")


if __name__ == "__main__":
    process_and_upload()
