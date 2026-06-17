import json
import logging
import hashlib
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.user import User
from app.models.contract import Contract
from app.models.analysis import Analysis
from app.models.contract_chat_history import ContractChatHistory
from app.services.llm_service import get_groq
from app.services.rag_chat_service import rewrite_query, _get_legal_collection, _get_model, SIMILARITY_THRESHOLD

logger = logging.getLogger(__name__)

def answer_contract_question(contract_id: int, question: str, user_id: int, db: Session) -> dict:
    """
    Answer a follow-up question about a specific contract's analysis results.
    Grounded in contract data, and queries ChromaDB for relevant law acts.
    """
    # 1. Fetch user to verify role
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # 2. Check contract ownership/permissions
    contract_query = db.query(Contract).filter(Contract.id == contract_id)
    if user.role != "admin":
        contract_query = contract_query.filter(Contract.user_id == user_id)
    contract = contract_query.first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    # 3. Retrieve analysis details
    analysis = db.query(Analysis).filter(Analysis.contract_id == contract_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Contract has not been analyzed yet. Run analysis first.")

    # 4. Query ChromaDB with rewritten query for law references
    rewritten = rewrite_query(question)
    logger.info(f"Contract Chat Query: '{question}' -> Rewritten: '{rewritten}'")

    excerpts = []
    law_sources = []
    legal_coll = _get_legal_collection()

    if legal_coll:
        try:
            query_embedding = _get_model().encode(rewritten).tolist()
            results = legal_coll.query(
                query_embeddings=[query_embedding],
                n_results=3,
                include=["documents", "metadatas", "distances"]
            )
            if results["distances"] and results["distances"][0]:
                for doc, meta, dist in zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0]
                ):
                    similarity = 1 - dist
                    if similarity >= SIMILARITY_THRESHOLD:
                        excerpts.append(doc)
                        act = meta.get("act", "Unknown Act")
                        section = meta.get("section", "")
                        source = f"{act}"
                        if section:
                            source += f" — Section {section}"
                        law_sources.append(source)
        except Exception as e:
            logger.warning(f"ChromaDB lookup failed in contract chat: {e}")

    # 5. Format clause results to supply stable IDs
    formatted_clauses = []
    clause_results = analysis.clause_results or []
    for c in clause_results:
        c_id = c.get("clause_id")
        if not c_id:
            c_id = hashlib.sha256(c.get("text", "").encode('utf-8')).hexdigest()[:12]
        formatted_clauses.append({
            "clause_id": c_id,
            "text": c.get("text", ""),
            "section_type": c.get("section_type", "other"),
            "risk_level": c.get("risk_level", "Low"),
            "risk_reasoning": c.get("risk_reasoning", ""),
            "alternative_clause": c.get("alternative_clause", "")
        })

    excerpts_text = "\n\n---\n\n".join(excerpts) if excerpts else "None"

    system_prompt = (
        "You are an expert contract chat assistant that helps users understand their specific contract analysis results.\n"
        "You must answer the user's question grounded in the contract details and relevant legal guidelines provided.\n\n"
        "Rules:\n"
        "1. Prioritize answering based on the provided Contract Analysis Details.\n"
        "2. If relevant, you may incorporate details from the provided Legal Guidelines, but only if they are relevant to the user's question.\n"
        "3. NEVER fabricate any Act names, sections, or law citations. If the Legal Guidelines section below is empty or says 'None', do not cite or name any Acts or sections.\n"
        "4. If the user's question is completely irrelevant to the contract or legal analysis (e.g. asking for weather, baking cookies, general non-contract questions), refuse to answer and state that the question is outside the scope of this contract workspace.\n"
        "5. Respond ONLY with a valid JSON object in this format:\n"
        "{\n"
        "  \"answer\": \"your detailed answer string here\",\n"
        "  \"referenced_clauses\": [\"list\", \"of\", \"clause_id\", \"strings\", \"referenced\"]\n"
        "}\n"
        "Output ONLY the JSON object, no markdown wrapper or extra characters."
    )

    user_content = (
        f"Contract Filename: {contract.filename}\n"
        f"Contract Type: {contract.contract_type}\n"
        f"Health Score: {analysis.health_score}\n"
        f"Bias: Buyer: {analysis.bias_buyer_pct}%, Vendor: {analysis.bias_vendor_pct}%, Neutral: {analysis.bias_neutral_pct}%\n\n"
        f"Contract Analysis Details (Clauses):\n{json.dumps(formatted_clauses, indent=2)}\n\n"
        f"Missing Clauses:\n{json.dumps(analysis.missing_clauses or [], indent=2)}\n\n"
        f"Negotiation Playbook:\n{json.dumps(analysis.negotiation_playbook or [], indent=2)}\n\n"
        f"Legal Guidelines (from knowledge base):\n{excerpts_text}\n\n"
        f"User's Question: {question}\n"
    )

    client = get_groq()
    if not client:
        raise HTTPException(status_code=503, detail="AI service unavailable")

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.1,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.strip("`").replace("json", "", 1).strip()

        data = json.loads(raw)
        answer = data["answer"]
        ref_clauses = data.get("referenced_clauses", [])
    except Exception as e:
        logger.error(f"Failed to generate contract chat response or parse JSON: {e}")
        answer = "I'm sorry, I was unable to compile the analysis response. Please try again."
        ref_clauses = []

    # 6. Save conversation to DB
    db_entry = ContractChatHistory(
        contract_id=contract_id,
        user_id=user_id,
        question=question,
        answer=answer,
        law_sources=list(set(law_sources)) if law_sources else [],
        referenced_clauses=ref_clauses
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)

    return {
        "id": db_entry.id,
        "contract_id": db_entry.contract_id,
        "question": db_entry.question,
        "answer": db_entry.answer,
        "law_sources": db_entry.law_sources,
        "referenced_clauses": db_entry.referenced_clauses,
        "created_at": db_entry.created_at.isoformat() if db_entry.created_at else None
    }
