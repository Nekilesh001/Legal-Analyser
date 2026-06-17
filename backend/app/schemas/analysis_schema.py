from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any

class AnalysisResponse(BaseModel):
    id: int
    contract_id: int
    health_score: Optional[float]
    bias_buyer_pct: Optional[float]
    bias_vendor_pct: Optional[float]
    bias_neutral_pct: Optional[float]
    clause_results: Optional[List[Dict[str, Any]]]
    missing_clauses: Optional[List[Dict[str, Any]]]
    negotiation_playbook: Optional[List[Dict[str, Any]]]
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    failed_clause_count: int
    created_at: datetime

    class Config:
        from_attributes = True
