import chromadb

client = chromadb.PersistentClient(path="./chroma_db")
coll = client.get_collection("legal_knowledge_base")
total = coll.count()
print(f"Total chunks in legal_knowledge_base: {total}")

# Retrieve all metadata entries
all_data = coll.get(include=["metadatas"])
metas = all_data["metadatas"]

unknown_count = 0
unknown_by_pdf = {}
total_by_pdf = {}

for m in metas:
    pdf = m.get("source_file", "unknown")
    section = m.get("section", "unknown")
    
    total_by_pdf[pdf] = total_by_pdf.get(pdf, 0) + 1
    if section == "unknown" or section is None:
        unknown_count += 1
        unknown_by_pdf[pdf] = unknown_by_pdf.get(pdf, 0) + 1

pct = (unknown_count / total) * 100 if total > 0 else 0
print(f"Chunks with section='unknown': {unknown_count} / {total} ({pct:.2f}%)")

print("\nBreakdown by source PDF (PDF: Unknown chunks / Total chunks (Percentage)):")
for pdf in sorted(total_by_pdf.keys()):
    t = total_by_pdf[pdf]
    u = unknown_by_pdf.get(pdf, 0)
    p = (u / t) * 100
    print(f"  {pdf}: {u} / {t} ({p:.2f}%)")
