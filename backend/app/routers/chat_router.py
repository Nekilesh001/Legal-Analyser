"""
Chat Router — Legal Q&A endpoints backed by RAG.
POST /chat/ask — answer a legal question with citations
GET /chat/history — retrieve past questions for the current user
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.chat_history import ChatHistory
from app.services.rag_chat_service import answer_legal_question

router = APIRouter()


class QuestionRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    id: int
    question: str
    answer: str
    sources: list
    low_confidence: bool
    retrieved_chunks: int


@router.post("/ask", response_model=ChatResponse)
def ask_legal_question(
    body: QuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Answer a legal question using RAG over the Indian law knowledge base.
    Every answer is persisted to chat_history for the user.
    """
    if not body.question or not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    question = body.question.strip()[:2000]  # limit question length

    # Get answer from RAG service
    result = answer_legal_question(question=question, user_id=current_user.id)

    # Persist to chat history
    history_entry = ChatHistory(
        user_id=current_user.id,
        question=question,
        answer=result["answer"],
        sources=result.get("sources", []),
        low_confidence=result.get("low_confidence", True),
        retrieved_chunks=result.get("retrieved_chunks", 0)
    )
    db.add(history_entry)
    db.commit()
    db.refresh(history_entry)

    return ChatResponse(
        id=history_entry.id,
        question=history_entry.question,
        answer=history_entry.answer,
        sources=history_entry.sources or [],
        low_confidence=history_entry.low_confidence,
        retrieved_chunks=history_entry.retrieved_chunks
    )


@router.get("/history")
def get_chat_history(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve past legal chat history for the current user, most recent first."""
    entries = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == current_user.id)
        .order_by(ChatHistory.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": e.id,
            "question": e.question,
            "answer": e.answer,
            "sources": e.sources or [],
            "low_confidence": e.low_confidence,
            "retrieved_chunks": e.retrieved_chunks,
            "created_at": e.created_at.isoformat() if e.created_at else None
        }
        for e in entries
    ]


@router.delete("/history/{entry_id}")
def delete_chat_history_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific chat history entry (user can only delete their own)."""
    entry = db.query(ChatHistory).filter(
        ChatHistory.id == entry_id,
        ChatHistory.user_id == current_user.id
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Chat history entry not found")

    db.delete(entry)
    db.commit()
    return {"message": "Deleted successfully"}
