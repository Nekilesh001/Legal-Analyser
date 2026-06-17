from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database import Base

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    health_score = Column(Float, nullable=True)
    bias_buyer_pct = Column(Float, nullable=True)
    bias_vendor_pct = Column(Float, nullable=True)
    bias_neutral_pct = Column(Float, nullable=True)
    clause_results = Column(JSON, nullable=True)
    missing_clauses = Column(JSON, nullable=True)
    negotiation_playbook = Column(JSON, nullable=True)
    high_risk_count = Column(Integer, default=0)
    medium_risk_count = Column(Integer, default=0)
    low_risk_count = Column(Integer, default=0)
    failed_clause_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())