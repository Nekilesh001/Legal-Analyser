import os
import re
import chromadb
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
client = chromadb.PersistentClient(path="backend/chroma_db")
try:
    client.delete_collection("contract_analysis_rag")
except Exception:
    pass
collection = client.create_collection("contract_analysis_rag", metadata={"hnsw:space": "cosine"})

def parse_markdown_entries(filepath: str, contract_type: str, doc_category: str) -> list[dict]:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    entries = content.split("## Clause:")[1:]
    parsed = []
    for entry in entries:
        title_line, *rest = entry.strip().split("\n", 1)
        body = rest[0] if rest else ""
        parsed.append({
            "title": title_line.strip(),
            "text": "## Clause:" + entry.strip(),
            "contract_type": contract_type,
            "category": doc_category
        })
    return parsed

def ingest():
    base_path = "rag_knowledge_base/contract_rules"
    if not os.path.exists(base_path):
        print("No knowledge base directories to ingest.")
        return
    doc_id = 0
    for contract_type in os.listdir(base_path):
        type_path = os.path.join(base_path, contract_type)
        if not os.path.isdir(type_path):
            continue
        for filename in os.listdir(type_path):
            doc_category = "mandatory_clauses" if "mandatory" in filename else "negotiation_playbook"
            entries = parse_markdown_entries(os.path.join(type_path, filename), contract_type, doc_category)
            for entry in entries:
                embedding = model.encode(entry["text"]).tolist()
                collection.add(
                    ids=[f"doc_{doc_id}"],
                    embeddings=[embedding],
                    documents=[entry["text"]],
                    metadatas=[{
                        "title": entry["title"],
                        "contract_type": entry["contract_type"],
                        "category": entry["category"]
                    }]
                )
                doc_id += 1
    print(f"Ingested {doc_id} entries into contract_analysis_rag")

if __name__ == "__main__":
    ingest()
