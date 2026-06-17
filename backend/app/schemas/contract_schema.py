from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ContractResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    file_hash: str
    contract_type: Optional[str]
    detected_language: Optional[str]
    extraction_method: Optional[str]
    raw_text_length: Optional[int]
    uploaded_at: datetime

    class Config:
        from_attributes = True
