"""
Analysis Router — Full orchestration of the analysis pipeline.
POST /analysis/run/{contract_id}: preprocessing → LLM analysis (concurrency limited)
  → health scoring → bias distribution → missing clauses → negotiation playbook
  → anomaly detection → persist to Analysis table → audit log.
"""
import asyncio
import logging
from functools import partial
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.contract import Contract
from app.models.analysis import Analysis
from app.models.audit_log import AuditLog
from app.services.extraction_service import extract_text
from app.services.ocr_service import perform_ocr
from app.services.preprocessing_pipeline import run_preprocessing_pipeline
from app.services.llm_service import analyze_clause
from app.services.scoring_service import compute_health_score
from app.services.bias_service import compute_bias_distribution
from app.services.rag_contract_service import detect_missing_clauses, generate_negotiation_playbook
from app.services.anomaly_service import detect_anomaly
from app.services.preprocessing_pipeline import MAX_CLAUSES_PER_CONTRACT

logger = logging.getLogger(__name__)

router = APIRouter()

CONCURRENCY_LIMIT = 5  # Max parallel LLM calls to avoid rate limiting


async def _analyze_clause_async(clause: dict, contract_type: str, semaphore: asyncio.Semaphore) -> dict:
    """Run analyze_clause in a thread pool with semaphore-based concurrency control."""
    async with semaphore:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            partial(analyze_clause, clause["text"], contract_type, clause.get("section_type", "other"))
        )
        return {**clause, **result}


@router.post("/run/{contract_id}")
async def run_analysis(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Run full analysis on a contract.
    1. Load contract from DB
    2. Re-extract text (or use stored metadata)
    3. Run preprocessing pipeline
    4. Analyze each clause with LLM (Groq + Gemini fallback)
    5. Compute health score + bias distribution
    6. Detect missing clauses (RAG)
    7. Generate negotiation playbook (RAG)
    8. Detect anomalies
    9. Persist to Analysis table
    """
    # Load contract (must belong to current user)
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.user_id == current_user.id
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    # Check if analysis already running / exists
    existing_analysis = db.query(Analysis).filter(
        Analysis.contract_id == contract_id
    ).first()
    if existing_analysis:
        # Return existing if already done (idempotent re-run overwrites)
        logger.info(f"Re-running analysis for contract {contract_id}, overwriting existing.")

    contract_type = contract.contract_type or "other"

    # Get stored raw text from the DB column.
    # This was stored during upload (contract_router.py).
    # If missing (contract was uploaded before this fix), fail explicitly
    # rather than fabricating placeholder text.
    raw_text = contract.raw_text
    if not raw_text or not raw_text.strip():
        raise HTTPException(
            status_code=422,
            detail=(
                "Contract text is not stored for this contract. "
                "Please re-upload the file to enable analysis. "
                "(This affects contracts uploaded before the raw text storage fix.)"
            )
        )
    clauses = run_preprocessing_pipeline(raw_text, contract_type)

    if not clauses:
        raise HTTPException(
            status_code=422,
            detail="No analyzable clauses found in this contract."
        )

    # Safety guard — preprocessing already caps at MAX_CLAUSES_PER_CONTRACT,
    # but double-check here and log clearly so it is visible in server logs.
    logger.info(
        f"[analysis] contract_id={contract_id}: {len(clauses)} clauses to analyze "
        f"(max allowed: {MAX_CLAUSES_PER_CONTRACT}, "
        f"estimated max Groq calls: {len(clauses) * 2})"
    )
    if len(clauses) > MAX_CLAUSES_PER_CONTRACT:
        # This should not happen after preprocessing cap, but be explicit
        logger.error(
            f"[analysis] SAFETY ABORT: {len(clauses)} clauses exceeds MAX_CLAUSES_PER_CONTRACT "
            f"({MAX_CLAUSES_PER_CONTRACT}). Refusing to run analysis to protect API quota."
        )
        raise HTTPException(
            status_code=422,
            detail=(
                f"Contract has too many clauses ({len(clauses)}) to analyze safely. "
                f"Maximum is {MAX_CLAUSES_PER_CONTRACT} clauses per contract. "
                "Large annexures may be causing over-segmentation. Please contact support."
            )
        )

    # Async LLM analysis with concurrency limit
    semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)
    tasks = [_analyze_clause_async(clause, contract_type, semaphore) for clause in clauses]
    clause_results = await asyncio.gather(*tasks)
    clause_results = list(clause_results)

    # Log total LLM calls consumed for audit/monitoring
    total_llm_calls = sum(r.get("llm_calls", 0) for r in clause_results)
    logger.info(
        f"[analysis] contract_id={contract_id}: LLM analysis complete. "
        f"{len(clause_results)} clauses, {total_llm_calls} total API calls."
    )

    # Compute scoring
    scoring = compute_health_score(clause_results)
    bias = compute_bias_distribution(clause_results)

    # RAG: Missing clauses
    clause_texts = [c["text"] for c in clauses]
    missing_clauses = detect_missing_clauses(clause_texts, contract_type)

    # RAG: Negotiation playbook (for High + Medium risk clauses)
    high_risk_clauses = [r for r in clause_results if r.get("risk_level") in ("High", "Medium")]
    negotiation_playbook = generate_negotiation_playbook(high_risk_clauses, contract_type)

    # Anomaly detection
    anomaly_flag = detect_anomaly(
        health_score=scoring.get("health_score"),
        contract_type=contract_type,
        user_id=current_user.id,
        db=db
    )

    # Persist to Analysis table
    if existing_analysis:
        analysis = existing_analysis
    else:
        analysis = Analysis(contract_id=contract_id)

    analysis.health_score = scoring.get("health_score")
    analysis.bias_buyer_pct = bias.get("buyer_pct")
    analysis.bias_vendor_pct = bias.get("vendor_pct")
    analysis.bias_neutral_pct = bias.get("neutral_pct")
    analysis.clause_results = clause_results
    analysis.missing_clauses = missing_clauses
    analysis.negotiation_playbook = negotiation_playbook
    analysis.high_risk_count = scoring.get("high_count", 0)
    analysis.medium_risk_count = scoring.get("medium_count", 0)
    analysis.low_risk_count = scoring.get("low_count", 0)
    analysis.failed_clause_count = scoring.get("failed_count", 0)

    if not existing_analysis:
        db.add(analysis)
    db.flush()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="analysis",
        file_hash=contract.file_hash,
        details=(
            f"Analysis complete: score={scoring.get('health_score')}, "
            f"clauses={len(clause_results)}, "
            f"missing={len(missing_clauses)}, "
            f"anomaly={anomaly_flag}"
        )
    )
    db.add(audit)
    db.commit()
    db.refresh(analysis)

    logger.info(
        f"Analysis {analysis.id} complete for contract {contract_id}: "
        f"score={scoring.get('health_score')}, {len(clause_results)} clauses"
    )

    return {
        "analysis_id": analysis.id,
        "contract_id": contract_id,
        "health_score": analysis.health_score,
        "bias": {
            "buyer_pct": analysis.bias_buyer_pct,
            "vendor_pct": analysis.bias_vendor_pct,
            "neutral_pct": analysis.bias_neutral_pct
        },
        "risk_counts": {
            "high": analysis.high_risk_count,
            "medium": analysis.medium_risk_count,
            "low": analysis.low_risk_count,
            "failed": analysis.failed_clause_count
        },
        "clause_count": len(clause_results),
        "missing_clauses": missing_clauses,
        "negotiation_playbook": negotiation_playbook,
        "anomaly_detected": anomaly_flag,
        "clause_results": clause_results
    }


@router.get("/{contract_id}")
def get_analysis(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve analysis results for a contract."""
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.user_id == current_user.id
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    analysis = db.query(Analysis).filter(Analysis.contract_id == contract_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found. Run analysis first.")

    return {
        "analysis_id": analysis.id,
        "contract_id": contract_id,
        "health_score": analysis.health_score,
        "bias": {
            "buyer_pct": analysis.bias_buyer_pct,
            "vendor_pct": analysis.bias_vendor_pct,
            "neutral_pct": analysis.bias_neutral_pct
        },
        "risk_counts": {
            "high": analysis.high_risk_count,
            "medium": analysis.medium_risk_count,
            "low": analysis.low_risk_count,
            "failed": analysis.failed_clause_count
        },
        "clause_results": analysis.clause_results,
        "missing_clauses": analysis.missing_clauses,
        "negotiation_playbook": analysis.negotiation_playbook,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None
    }


@router.get("/{contract_id}/export/json")
def export_analysis_json(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export analysis as raw JSON."""
    from fastapi.responses import JSONResponse
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.user_id == current_user.id
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    analysis = db.query(Analysis).filter(Analysis.contract_id == contract_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    export_data = {
        "disclaimer": "This analysis is for informational purposes only and does not constitute legal advice. Consult a qualified lawyer for legal guidance.",
        "contract": {"id": contract.id, "filename": contract.filename, "contract_type": contract.contract_type},
        "health_score": analysis.health_score,
        "bias": {"buyer_pct": analysis.bias_buyer_pct, "vendor_pct": analysis.bias_vendor_pct, "neutral_pct": analysis.bias_neutral_pct},
        "risk_counts": {"high": analysis.high_risk_count, "medium": analysis.medium_risk_count, "low": analysis.low_risk_count},
        "missing_clauses": analysis.missing_clauses,
        "negotiation_playbook": analysis.negotiation_playbook,
        "clause_results": analysis.clause_results
    }
    return JSONResponse(content=export_data, headers={"Content-Disposition": f'attachment; filename="analysis_{contract_id}.json"'})


@router.get("/{contract_id}/export/csv")
def export_analysis_csv(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export clause analysis as CSV (UTF-8 BOM for Excel Tamil compat)."""
    import csv
    import io
    from fastapi.responses import StreamingResponse

    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.user_id == current_user.id
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    analysis = db.query(Analysis).filter(Analysis.contract_id == contract_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Clause", "Language", "Section Type", "Risk Level", "Confidence",
        "Risk Reasoning", "Bias Label", "Bias Confidence",
        "Alternative Clause", "Analysis Failed"
    ])

    for r in (analysis.clause_results or []):
        writer.writerow([
            r.get("text", ""),
            r.get("language", ""),
            r.get("section_type", ""),
            r.get("risk_level", ""),
            r.get("confidence", ""),
            r.get("risk_reasoning", ""),
            r.get("bias_label", ""),
            r.get("bias_confidence", ""),
            r.get("alternative_clause", ""),
            r.get("analysis_failed", False)
        ])

    # UTF-8 BOM for Excel compatibility (handles Tamil correctly)
    csv_bytes = ("\ufeff" + output.getvalue()).encode("utf-8")
    return StreamingResponse(
        iter([csv_bytes]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="analysis_{contract_id}.csv"'}
    )


@router.get("/{contract_id}/export/pdf")
def export_analysis_pdf(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export analysis as a styled PDF report."""
    from fastapi.responses import Response
    from app.services.report_service import generate_pdf_report

    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.user_id == current_user.id
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    analysis = db.query(Analysis).filter(Analysis.contract_id == contract_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    try:
        pdf_bytes = generate_pdf_report(analysis.id, db)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="analysis_{contract_id}.pdf"'}
        )
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")


@router.get("/compare/{contract_id_1}/{contract_id_2}")
def compare_contracts(
    contract_id_1: int,
    contract_id_2: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compare two contract versions using SBERT clause similarity.
    Returns details on unchanged, reworded, added, and removed clauses.
    """
    import numpy as np

    # Fetch contracts
    c1 = db.query(Contract).filter(Contract.id == contract_id_1, Contract.user_id == current_user.id).first()
    c2 = db.query(Contract).filter(Contract.id == contract_id_2, Contract.user_id == current_user.id).first()
    if not c1 or not c2:
        raise HTTPException(status_code=404, detail="One or both contracts not found")

    # Fetch analyses
    a1 = db.query(Analysis).filter(Analysis.contract_id == contract_id_1).first()
    a2 = db.query(Analysis).filter(Analysis.contract_id == contract_id_2).first()
    if not a1 or not a2:
        raise HTTPException(status_code=400, detail="Both contracts must be analyzed before comparing")

    clauses_1 = a1.clause_results or []
    clauses_2 = a2.clause_results or []

    # If either contract has no clauses, return simple comparison
    if not clauses_1 or not clauses_2:
        return {
            "health_score_delta": round((a2.health_score or 0) - (a1.health_score or 0), 1),
            "unchanged": [],
            "reworded": [],
            "added": [{"text": c.get("text"), "section_type": c.get("section_type", "other")} for c in clauses_2],
            "removed": [{"text": c.get("text"), "section_type": c.get("section_type", "other")} for c in clauses_1]
        }

    # Extract texts
    texts_1 = [c.get("text", "") for c in clauses_1]
    texts_2 = [c.get("text", "") for c in clauses_2]

    # Embed clauses
    from app.services.dedup_service import get_model
    model = get_model()
    embeddings_1 = model.encode(texts_1, convert_to_numpy=True)
    embeddings_2 = model.encode(texts_2, convert_to_numpy=True)

    # Cosine similarity matrix
    norm_1 = embeddings_1 / np.linalg.norm(embeddings_1, axis=1, keepdims=True)
    norm_2 = embeddings_2 / np.linalg.norm(embeddings_2, axis=1, keepdims=True)
    sim_matrix = np.dot(norm_2, norm_1.T)  # shape: (len(clauses_2), len(clauses_1))

    unchanged = []
    reworded = []
    added = []
    removed_indices = set(range(len(clauses_1)))

    for i2, t2 in enumerate(texts_2):
        # Find best match in version 1
        best_i1 = np.argmax(sim_matrix[i2])
        best_sim = sim_matrix[i2][best_i1]

        if best_sim >= 0.8:
            # Matched a clause in version 1
            if best_i1 in removed_indices:
                removed_indices.remove(best_i1)
            
            # Exact match vs reworded
            if t2.strip() == texts_1[best_i1].strip():
                unchanged.append({
                    "text": t2,
                    "section_type": clauses_2[i2].get("section_type", "other")
                })
            else:
                reworded.append({
                    "original_text": texts_1[best_i1],
                    "new_text": t2,
                    "section_type": clauses_2[i2].get("section_type", "other"),
                    "similarity": float(best_sim)
                })
        else:
            # No close match, this is a newly added clause
            added.append({
                "text": t2,
                "section_type": clauses_2[i2].get("section_type", "other")
            })

    removed = []
    for i1 in removed_indices:
        removed.append({
            "text": texts_1[i1],
            "section_type": clauses_1[i1].get("section_type", "other")
        })

    return {
        "health_score_delta": round((a2.health_score or 0) - (a1.health_score or 0), 1),
        "unchanged": unchanged,
        "reworded": reworded,
        "added": added,
        "removed": removed
    }


