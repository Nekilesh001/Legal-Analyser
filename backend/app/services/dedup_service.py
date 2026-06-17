from sentence_transformers import SentenceTransformer
import numpy as np

# Lazy load
_model = None
def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    return _model

def embed_clauses(clauses: list[str]) -> np.ndarray:
    return get_model().encode(clauses, convert_to_numpy=True)

def deduplicate_clauses(clauses: list[str], similarity_threshold: float = 0.92) -> dict:
    if len(clauses) == 0:
        return {"unique_clauses": [], "duplicate_map": {}}

    embeddings = embed_clauses(clauses)
    norm_embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
    similarity_matrix = np.dot(norm_embeddings, norm_embeddings.T)

    unique_indices = []
    duplicate_map = {}
    assigned = set()

    for i in range(len(clauses)):
        if i in assigned:
            continue
        unique_indices.append(i)
        assigned.add(i)
        for j in range(i + 1, len(clauses)):
            if j in assigned:
                continue
            if similarity_matrix[i][j] >= similarity_threshold:
                duplicate_map[j] = i
                assigned.add(j)

    unique_clauses = [clauses[i] for i in unique_indices]
    return {"unique_clauses": unique_clauses, "duplicate_map": duplicate_map, "unique_indices": unique_indices}
