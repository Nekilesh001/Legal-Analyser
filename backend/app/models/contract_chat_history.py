from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database import Base

class ContractChatHistory(Base):
    __tablename__ = "contract_chat_history"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(String, nullable=False)
    answer = Column(String, nullable=False)
    law_sources = Column(JSON, nullable=True)  # List of legal Act citations cited above threshold
    referenced_clauses = Column(JSON, nullable=True)  # List of stable clause_id strings referenced
    created_at = Column(DateTime(timezone=True), server_default=func.now())
