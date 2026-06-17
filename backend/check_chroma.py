import chromadb

client = chromadb.PersistentClient(path="./chroma_db")
print("Collections:", client.list_collections())

try:
    coll = client.get_collection("legal_knowledge_base")
    print("legal_knowledge_base entry count:", coll.count())
    
    # Get 3 sample entries
    peek = coll.peek(limit=3)
    for i in range(len(peek["ids"])):
        print(f"\n--- Entry {i+1} ---")
        print("ID:", peek["ids"][i])
        print("Metadata:", peek["metadatas"][i])
        print("Document preview:", peek["documents"][i][:300] + "...")
except Exception as e:
    print("Error querying legal_knowledge_base:", e)

try:
    coll2 = client.get_collection("contract_analysis_rag")
    print("\ncontract_analysis_rag entry count:", coll2.count())
    
    # Get breakdown
    all_data = coll2.get()
    metas = all_data["metadatas"]
    breakdown = {}
    for m in metas:
        c_type = m.get("contract_type", "unknown")
        category = m.get("category", "unknown")
        key = (c_type, category)
        breakdown[key] = breakdown.get(key, 0) + 1
    
    print("\nBreakdown of contract_analysis_rag:")
    for (ct, cat), cnt in sorted(breakdown.items()):
        print(f"  Contract Type: {ct} | Category: {cat} | Count: {cnt}")
except Exception as e:
    print("Error querying contract_analysis_rag:", e)
