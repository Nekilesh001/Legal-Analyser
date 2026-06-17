"""
Contract Router — Full upload endpoint with SHA-256 hash, DB persistence,
extraction pipeline, OCR fallback, AuditLog entry.
"""
import os
import shutil
import tempfile
import logging
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.contract import Contract
from app.models.audit_log import AuditLog
from app.schemas.contract_schema import ContractResponse
from app.services.extraction_service import extract_text
from app.services.ocr_service import perform_ocr
from app.utils.hashing import get_file_hash

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}
MAX_FILE_SIZE_MB = 50


def _get_file_extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


@router.post("/upload", response_model=ContractResponse)
async def upload_contract(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a contract file (PDF, DOCX, TXT).
    - Computes SHA-256 hash for deduplication
    - Extracts text (pdfplumber / docx / txt)
    - Falls back to OCR if PDF has insufficient text
    - Stores Contract row + AuditLog entry in Postgres
    """
    ext = _get_file_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {ALLOWED_EXTENSIONS}"
        )

    # Read file content
    content = await file.read()

    # Size guard
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Max allowed: {MAX_FILE_SIZE_MB} MB"
        )

    # SHA-256 hash
    file_hash = get_file_hash(content)

    # Check for duplicate upload by same user
    existing = db.query(Contract).filter(
        Contract.user_id == current_user.id,
        Contract.file_hash == file_hash
    ).first()
    if existing:
        # Check if this contract already has a completed analysis
        from app.models.analysis import Analysis
        has_analysis = db.query(Analysis).filter(
            Analysis.contract_id == existing.id
        ).first() is not None

        if has_analysis:
            # Fully analyzed already — return existing contract (idempotent, no 409)
            logger.info(
                f"Duplicate upload by user {current_user.username}: "
                f"contract {existing.id} already analyzed. Returning existing."
            )
            return existing
        else:
            # File uploaded but analysis never completed — allow re-analysis
            # Return with a header flag so the frontend can trigger analysis immediately
            logger.info(
                f"Duplicate upload by user {current_user.username}: "
                f"contract {existing.id} has no analysis yet. Returning for re-analysis."
            )
            # Return the existing contract so frontend can re-trigger POST /analysis/run/{id}
            return existing

    # Save to temp file for processing
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        extraction = extract_text(tmp_path, ext)
        extraction_method = extraction["method"]
        extracted_text = extraction["text"]
        detected_language = "english"  # will be updated by NLP pipeline later

        # If PDF has too little text, run OCR
        if extraction_method == "needs_ocr":
            logger.info(f"Running OCR on {file.filename} (avg chars/page too low)")
            ocr_result = perform_ocr(tmp_path)
            extracted_text = ocr_result["text"]
            extraction_method = ocr_result["method"]

    except Exception as e:
        logger.error(f"Extraction failed for {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    # Detect contract type from filename heuristics (refined later by NLP)
    contract_type = _guess_contract_type(file.filename)

    # Persist Contract row (raw_text stored for re-analysis without needing the original file)
    contract = Contract(
        user_id=current_user.id,
        filename=file.filename,
        file_hash=file_hash,
        contract_type=contract_type,
        detected_language=detected_language,
        extraction_method=extraction_method,
        raw_text_length=len(extracted_text),
        raw_text=extracted_text,  # Store for re-analysis — eliminates demo text fallback
    )
    db.add(contract)
    db.flush()  # get contract.id before commit

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="upload",
        file_hash=file_hash,
        details=f"Uploaded {file.filename} ({ext}, {len(extracted_text)} chars, method={extraction_method})"
    )
    db.add(audit)
    db.commit()
    db.refresh(contract)

    logger.info(
        f"Contract {contract.id} uploaded by user {current_user.username}: "
        f"{file.filename} ({extraction_method}, {len(extracted_text)} chars)"
    )
    return contract


@router.get("/", response_model=list[ContractResponse])
def list_contracts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all contracts uploaded by the current user."""
    return db.query(Contract).filter(Contract.user_id == current_user.id).all()


@router.get("/{contract_id}/status")
def get_contract_status(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Return the analysis status for a contract.
    Status values:
      - 'not_analyzed': contract exists, no Analysis row
      - 'complete':     Analysis row exists with a health_score
      - 'not_found':    contract doesn't exist / not owned by user
    """
    from app.models.analysis import Analysis
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.user_id == current_user.id
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    analysis = db.query(Analysis).filter(Analysis.contract_id == contract_id).first()
    status = "complete" if (analysis and analysis.health_score is not None) else "not_analyzed"
    return {
        "contract_id": contract_id,
        "status": status,
        "analysis_id": analysis.id if analysis else None,
        "health_score": analysis.health_score if analysis else None,
    }


@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single contract by ID (must belong to current user)."""
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.user_id == current_user.id
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


from pydantic import BaseModel
from app.models.contract_chat_history import ContractChatHistory
from app.services.contract_chat_service import answer_contract_question

class ContractQuestionRequest(BaseModel):
    question: str

@router.post("/{contract_id}/chat")
def chat_about_contract(
    contract_id: int,
    body: ContractQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ask a follow-up question about a specific contract's analysis."""
    if not body.question or not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    return answer_contract_question(
        contract_id=contract_id,
        question=body.question.strip(),
        user_id=current_user.id,
        db=db
    )

@router.get("/{contract_id}/chat/history")
def get_contract_chat_history(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve prior contract chat history (user must own the contract; admin can access any)."""
    # Verify contract ownership/access
    contract_query = db.query(Contract).filter(Contract.id == contract_id)
    if current_user.role != "admin":
        contract_query = contract_query.filter(Contract.user_id == current_user.id)
    contract = contract_query.first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    entries = (
        db.query(ContractChatHistory)
        .filter(ContractChatHistory.contract_id == contract_id)
        .order_by(ContractChatHistory.created_at.asc())
        .all()
    )

    return [
        {
            "id": e.id,
            "contract_id": e.contract_id,
            "question": e.question,
            "answer": e.answer,
            "law_sources": e.law_sources or [],
            "referenced_clauses": e.referenced_clauses or [],
            "created_at": e.created_at.isoformat() if e.created_at else None
        }
        for e in entries
    ]


def _guess_contract_type(filename: str) -> str:
    """Heuristic contract type detection from filename keywords."""
    name = filename.lower()
    if any(k in name for k in ("employ", "offer", "appointment", "hr")):
        return "employment"
    if any(k in name for k in ("vendor", "supplier", "purchase", "supply")):
        return "vendor"
    if any(k in name for k in ("lease", "rent", "tenancy")):
        return "lease"
    if any(k in name for k in ("nda", "confidential", "non-disclosure")):
        return "nda"
    if any(k in name for k in ("sla", "service level", "support")):
        return "sla"
    return "other"
