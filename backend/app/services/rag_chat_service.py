"""
RAG Chat Service — Full implementation with similarity guardrails,
system prompt enforcing answer grounding, source citations,
and explicit refusal when retrieval confidence is below threshold.
"""
import logging
from typing import Optional
from app.services.llm_service import get_groq

logger = logging.getLogger(__name__)

SIMILARITY_THRESHOLD = 0.65  # Cosine similarity minimum to attempt an answer

SYSTEM_PROMPT = """You are a legal information assistant specializing in Indian law.
You MUST answer using ONLY the provided document excerpts below.
Do NOT use any information from your own training data or general knowledge.

Rules you must follow:
1. If the excerpts do not contain enough information to answer the question, explicitly say so rather than guessing.
2. Always end your answer with the exact source citations (Act name and section number) for every excerpt you used.
3. If any excerpt is marked as amended, mention this and note the user should verify the current version applies.
4. If any excerpt is jurisdiction-specific (e.g. Tamil Nadu), mention that the answer may differ in other states.
5. Begin every answer with: "Based on the available legal documents:"

IMPORTANT DISCLAIMER: This information is for general awareness only and does not constitute legal advice. 
Consult a qualified lawyer before taking any legal action.
"""

ACRONYM_MAP = {
    "posh": "What is the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 and what does it require?",
    "posh act": "What is the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 and what does it require?",
    "msmed": "What is the Micro, Small and Medium Enterprises Development Act, 2006 and what does it require?",
    "msme": "What is the Micro, Small and Medium Enterprises Development Act, 2006 and what does it require?",
    "msmed act": "What is the Micro, Small and Medium Enterprises Development Act, 2006 and what does it require?",
    "msme act": "What is the Micro, Small and Medium Enterprises Development Act, 2006 and what does it require?",
    "cgst": "What is the Central Goods and Services Tax Act, 2017 and what does it require?",
    "cgst act": "What is the Central Goods and Services Tax Act, 2017 and what does it require?",
    "gst": "What is the Central Goods and Services Tax Act, 2017 and what does it require?",
    "gst act": "What is the Central Goods and Services Tax Act, 2017 and what does it require?",
    "epf": "What is the Employees' Provident Funds and Miscellaneous Provisions Act, 1952 and what does it require?",
    "pf": "What is the Employees' Provident Funds and Miscellaneous Provisions Act, 1952 and what does it require?",
    "epf act": "What is the Employees' Provident Funds and Miscellaneous Provisions Act, 1952 and what does it require?",
    "pf act": "What is the Employees' Provident Funds and Miscellaneous Provisions Act, 1952 and what does it require?",
    "esic": "What is the Employees' State Insurance Act, 1948 and what does it require?",
    "esi": "What is the Employees' State Insurance Act, 1948 and what does it require?",
    "esic act": "What is the Employees' State Insurance Act, 1948 and what does it require?",
    "esi act": "What is the Employees' State Insurance Act, 1948 and what does it require?",
    "it act": "What is the Information Technology Act, 2000 and what does it require?",
    "it act 2000": "What is the Information Technology Act, 2000 and what does it require?",
    "cpc": "What is the Code of Civil Procedure, 1908 and what does it require?",
    "cpc 1908": "What is the Code of Civil Procedure, 1908 and what does it require?",
    "pmla": "What is the Prevention of Money Laundering Act, 2003 and what does it require?",
    "pmla act": "What is the Prevention of Money Laundering Act, 2003 and what does it require?",
    "drt": "What is the Recovery of Debts Due to Banks and Financial Institutions Act, 1993 and what does it require?",
    "drt act": "What is the Recovery of Debts Due to Banks and Financial Institutions Act, 1993 and what does it require?",
    "tpa": "What is the Transfer of Property Act, 1882 and what does it require?",
    "tpa act": "What is the Transfer of Property Act, 1882 and what does it require?",
    "ipc": "What is the Indian Penal Code, 1860 and what does it require?",
    "ipc act": "What is the Indian Penal Code, 1860 and what does it require?",
    "ica": "What is the Indian Contract Act, 1872 and what does it require?",
    "ica act": "What is the Indian Contract Act, 1872 and what does it require?",
    "ni act": "What is the Negotiable Instruments Act, 1881 and what does it require?",
    "sarfaesi": "What is the Securitisation and Reconstruction of Financial Assets and Enforcement of Security Interest Act, 2002 and what does it require?",
    "sarfaesi act": "What is the Securitisation and Reconstruction of Financial Assets and Enforcement of Security Interest Act, 2002 and what does it require?"
}

_model = None
_legal_collection = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    return _model


def _get_legal_collection():
    """Return the legal_knowledge_base ChromaDB collection.
    
    Returns None ONLY if the collection literally does not exist yet (script
    not run). Never falls back to a different collection — that would return
    misleading citations from contract playbooks instead of real Act text.
    """
    global _legal_collection
    if _legal_collection is None:
        import chromadb
        try:
            client = chromadb.PersistentClient(path="./chroma_db")
            _legal_collection = client.get_collection("legal_knowledge_base")
        except Exception as e:
            logger.warning(
                f"legal_knowledge_base collection not available: {e}. "
                "Run: python scripts/chunk_legal_documents.py"
            )
            return None
    return _legal_collection


def _rewrite_query_with_llm(question: str) -> str:
    """Send query to Groq for expansion using formal legal terminology."""
    client = get_groq()
    if not client:
        return question

    prompt = (
        "You are a helpful assistant that rewrites casual, short, or acronym-based legal questions "
        "into formal legal search queries to improve database semantic retrieval.\n\n"
        "Rules:\n"
        "1. Rewrite the query using formal legal terminology and full Act names where applicable.\n"
        "2. Do NOT answer the question. Only output the rewritten question itself.\n"
        "3. Do NOT add any introductory text, explanation, or quotes. Output ONLY the raw rewritten question.\n\n"
        "Examples:\n"
        "\"what is POSH act\" -> \"What is the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 and what does it require?\"\n"
        "\"can my employer fire me without notice\" -> \"What are the legal requirements and notice period for employee termination under Indian labour law?\"\n"
        "\"tell me about GST\" -> \"What is the Central Goods and Services Tax Act, 2017 and what are its key provisions?\"\n\n"
        f"Query to rewrite: \"{question}\"\n"
        "Rewritten Query:"
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=100
        )
        rewritten = response.choices[0].message.content.strip()
        if rewritten.startswith('"') and rewritten.endswith('"'):
            rewritten = rewritten[1:-1].strip()
        return rewritten if rewritten else question
    except Exception as e:
        logger.warning(f"Failed to rewrite query using LLM: {e}")
        return question


def rewrite_query(question: str) -> str:
    """Expand acronyms via lookup or rewrite the query using LLM."""
    clean_q = question.strip().lower().rstrip("?").strip()
    if clean_q in ACRONYM_MAP:
        return ACRONYM_MAP[clean_q]
    return _rewrite_query_with_llm(question)


def answer_legal_question(question: str, user_id: Optional[int] = None) -> dict:
    """
    Answer a legal question using RAG with strict guardrails.

    Returns:
    {
        "answer": str,
        "sources": list[str],
        "low_confidence": bool,
        "retrieved_chunks": int
    }
    """
    legal_coll = _get_legal_collection()

    # IMPORTANT: Never fall back to the contract analysis collection.
    # That collection holds contract playbook content, not Act text.
    # Falling back would produce misleading citations (playbook entries cited
    # as if they were statutory sources). Show an explicit error instead.
    if legal_coll is None:
        return {
            "answer": (
                "The legal knowledge base has not been set up yet. "
                "An administrator needs to run the ingestion script: "
                "python scripts/chunk_legal_documents.py\n\n"
                "Until then, legal chat answers are unavailable. "
                "Please consult a qualified lawyer for your question."
            ),
            "sources": [],
            "low_confidence": True,
            "retrieved_chunks": 0
        }

    # Rewrite the query before search
    rewritten_question = rewrite_query(question)
    logger.info(f"Original query: '{question}' -> Rewritten: '{rewritten_question}'")

    try:
        query_embedding = _get_model().encode(rewritten_question).tolist()
        results = legal_coll.query(
            query_embeddings=[query_embedding],
            n_results=5,
            include=["documents", "metadatas", "distances"]
        )

        if not results["distances"] or not results["distances"][0]:
            return _low_confidence_response()

        # Cosine distance to cosine similarity: similarity = 1 - distance
        best_similarity = 1 - results["distances"][0][0]

        if best_similarity < SIMILARITY_THRESHOLD:
            logger.info(
                f"Low retrieval confidence for question: '{question[:80]}...' "
                f"(best similarity={best_similarity:.3f} < {SIMILARITY_THRESHOLD})"
            )
            return _low_confidence_response()

        # Build excerpts and sources
        excerpts = []
        sources = []
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0]
        ):
            similarity = 1 - dist
            if similarity >= SIMILARITY_THRESHOLD * 0.8:  # Include slightly below threshold for context
                excerpts.append(doc)

                # Format source citation
                act = meta.get("act", meta.get("contract_type", "Unknown Act"))
                section = meta.get("section", meta.get("category", ""))
                title = meta.get("title", "")
                source = f"{act}"
                if section:
                    source += f" — Section {section}"
                if title:
                    source += f" ({title})"
                sources.append(source)

        if not excerpts:
            return _low_confidence_response()

        excerpts_text = "\n\n---\n\n".join(excerpts)
        full_prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"Document excerpts:\n{excerpts_text}\n\n"
            f"Question: {question}"
        )

        client = get_groq()
        if not client:
            return {
                "answer": (
                    "The AI service is temporarily unavailable. "
                    "Please try again later. ⚠️ This is not legal advice."
                ),
                "sources": sources,
                "low_confidence": True,
                "retrieved_chunks": len(excerpts)
            }

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": full_prompt}],
            temperature=0.1,
        )

        answer_text = response.choices[0].message.content.strip()

        # Append disclaimer if not already present
        if "not constitute legal advice" not in answer_text.lower():
            answer_text += "\n\n⚠️ Disclaimer: This information is for general awareness only and does not constitute legal advice. Consult a qualified lawyer before taking any action."

        return {
            "answer": answer_text,
            "sources": list(set(sources)),  # deduplicate
            "low_confidence": False,
            "retrieved_chunks": len(excerpts)
        }

    except Exception as e:
        logger.error(f"RAG chat error: {e}")
        return {
            "answer": (
                "I encountered an error while processing your question. "
                "Please try again. ⚠️ This is not legal advice."
            ),
            "sources": [],
            "low_confidence": True,
            "retrieved_chunks": 0
        }


def _low_confidence_response() -> dict:
    return {
        "answer": (
            "I could not find relevant information in the legal document base for this question. "
            "This may be because the question is outside the scope of the available legal documents, "
            "or the information is not in our database. "
            "Please consult a qualified lawyer for guidance on this matter.\n\n"
            "⚠️ Disclaimer: This is not legal advice."
        ),
        "sources": [],
        "low_confidence": True,
        "retrieved_chunks": 0
    }
