"""
RAG Contract Service — Full implementation.
detect_missing_clauses: retrieves mandatory clauses from ChromaDB, calls Groq to identify gaps.
generate_negotiation_playbook: retrieves playbook entries, categorizes flagged clauses.
"""
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_model = None
_collection = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    return _model


def _get_collection():
    global _collection
    if _collection is None:
        import chromadb
        try:
            client = chromadb.PersistentClient(path="./chroma_db")
            _collection = client.get_collection("contract_analysis_rag")
        except Exception as e:
            logger.warning(f"ChromaDB collection not available: {e}")
            return None
    return _collection


def retrieve_mandatory_clauses(contract_type: str, top_k: int = 15) -> list[dict]:
    """Retrieve mandatory clause requirements for a contract type from ChromaDB."""
    coll = _get_collection()
    if not coll:
        return []

    try:
        query_embedding = _get_model().encode(
            f"mandatory clauses requirements for {contract_type} contracts Indian law"
        ).tolist()

        results = coll.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where={"$and": [{"contract_type": {"$eq": contract_type}}, {"category": {"$eq": "mandatory_clauses"}}]}
        )

        if not results["documents"] or not results["documents"][0]:
            # Fallback: query without contract_type filter
            results = coll.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where={"category": {"$eq": "mandatory_clauses"}}
            )

        return [
            {"text": doc, "title": meta.get("title", "Unknown")}
            for doc, meta in zip(results["documents"][0], results["metadatas"][0])
        ]
    except Exception as e:
        logger.warning(f"Mandatory clause retrieval failed: {e}")
        return []


def retrieve_playbook_entries(contract_type: str, top_k: int = 15) -> list[dict]:
    """Retrieve negotiation playbook entries for a contract type from ChromaDB."""
    coll = _get_collection()
    if not coll:
        return []

    try:
        query_embedding = _get_model().encode(
            f"negotiation playbook counter-clause for {contract_type} contracts"
        ).tolist()

        results = coll.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where={"$and": [{"contract_type": {"$eq": contract_type}}, {"category": {"$eq": "negotiation_playbook"}}]}
        )

        if not results["documents"] or not results["documents"][0]:
            results = coll.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where={"category": {"$eq": "negotiation_playbook"}}
            )

        return [
            {"text": doc, "title": meta.get("title", "Unknown")}
            for doc, meta in zip(results["documents"][0], results["metadatas"][0])
        ]
    except Exception as e:
        logger.warning(f"Playbook retrieval failed: {e}")
        return []


def detect_missing_clauses(present_clauses: list[str], contract_type: str) -> list[dict]:
    """
    Compare clauses present in the contract against mandatory requirements
    retrieved from the knowledge base. Use Groq to identify gaps.

    Returns list of:
    {"missing_requirement": str, "law_reference": str, "severity": "critical"|"recommended"}
    """
    requirements = retrieve_mandatory_clauses(contract_type)
    if not requirements:
        logger.info(f"No mandatory clauses found for {contract_type} — knowledge base may not be ingested yet")
        return []

    requirements_text = "\n\n".join(r["text"] for r in requirements[:10])
    present_text = "\n".join(f"- {c[:200]}" for c in present_clauses[:40])

    prompt = f"""You are an Indian contract law expert. 
Given MANDATORY REQUIREMENTS for a {contract_type} contract under Indian law, 
and CLAUSES PRESENT in the contract, identify which mandatory requirements are MISSING.

MANDATORY REQUIREMENTS:
{requirements_text}

CLAUSES PRESENT IN CONTRACT:
{present_text}

Respond with ONLY a JSON array. Each item must follow this schema exactly:
{{"missing_requirement": "<title of missing clause>", "law_reference": "<Act and Section>", "severity": "critical" | "recommended"}}

If nothing is missing, respond with an empty array: []
Do not include any explanation, only the JSON array."""

    try:
        from app.services.llm_service import get_groq
        client = get_groq()
        if not client:
            return []

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
        )
        raw = response.choices[0].message.content.strip()

        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.strip("`").lstrip("json").strip()

        result = json.loads(raw)
        if isinstance(result, list):
            return result
        return []

    except json.JSONDecodeError as e:
        logger.warning(f"JSON parse error in missing clause detection: {e}")
        return []
    except Exception as e:
        logger.warning(f"Missing clause detection failed: {e}")
        return []


def generate_negotiation_playbook(
    flagged_clauses: list[dict],
    contract_type: str
) -> list[dict]:
    """
    Generate negotiation recommendations for High/Medium risk clauses,
    grounded in the knowledge base playbook entries.

    Returns list of:
    {
        "clause_text": str,
        "risk_level": str,
        "risk_reasoning": str,
        "category": "must_fix" | "should_negotiate" | "accept_as_is",
        "recommended_action": str,
        "counter_clause": str,
        "law_reference": str
    }
    """
    if not flagged_clauses:
        return []

    playbook_entries = retrieve_playbook_entries(contract_type)
    if not playbook_entries:
        # Return basic recommendations without RAG context
        return _generate_fallback_playbook(flagged_clauses)

    playbook_text = "\n\n".join(e["text"] for e in playbook_entries[:8])

    clauses_summary = "\n".join(
        f"- [{c.get('risk_level', 'Unknown')}] {c.get('text', '')[:300]}"
        for c in flagged_clauses[:15]
    )

    prompt = f"""You are an Indian contract law negotiation expert.
Given HIGH/MEDIUM RISK CLAUSES from a {contract_type} contract and NEGOTIATION PLAYBOOK ENTRIES 
from Indian legal knowledge base, generate a negotiation playbook.

NEGOTIATION PLAYBOOK KNOWLEDGE BASE:
{playbook_text}

FLAGGED HIGH/MEDIUM RISK CLAUSES:
{clauses_summary}

For each flagged clause, respond with ONLY a JSON array. Each item must follow this schema:
{{
  "clause_text": "<first 100 chars of original clause>",
  "risk_level": "High" | "Medium",
  "category": "must_fix" | "should_negotiate" | "accept_as_is",
  "recommended_action": "<specific action in 1-2 sentences>",
  "counter_clause": "<suggested replacement wording>",
  "law_reference": "<relevant Act and Section if applicable, else null>"
}}

Categories: must_fix = High risk legally; should_negotiate = Medium risk, worth pushing back; 
accept_as_is = technically risk-flagged but commercially standard.
Respond ONLY with the JSON array, no other text."""

    try:
        from app.services.llm_service import get_groq
        client = get_groq()
        if not client:
            return _generate_fallback_playbook(flagged_clauses)

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.15,
        )
        raw = response.choices[0].message.content.strip()

        if raw.startswith("```"):
            raw = raw.strip("`").lstrip("json").strip()

        result = json.loads(raw)
        if isinstance(result, list):
            return result
        return _generate_fallback_playbook(flagged_clauses)

    except Exception as e:
        logger.warning(f"Negotiation playbook generation failed: {e}")
        return _generate_fallback_playbook(flagged_clauses)


def _generate_fallback_playbook(flagged_clauses: list[dict]) -> list[dict]:
    """Fallback playbook when RAG or LLM is unavailable."""
    playbook = []
    for clause in flagged_clauses[:10]:
        risk = clause.get("risk_level", "Medium")
        category = "must_fix" if risk == "High" else "should_negotiate"
        playbook.append({
            "clause_text": clause.get("text", "")[:100],
            "risk_level": risk,
            "category": category,
            "recommended_action": clause.get("alternative_reasoning", "Review and negotiate this clause with a qualified lawyer."),
            "counter_clause": clause.get("alternative_clause", "Consult legal counsel for a balanced alternative."),
            "law_reference": None
        })
    return playbook
