from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)
    contract_type = Column(String, nullable=True)
    detected_language = Column(String, nullable=True)
    extraction_method = Column(String, nullable=True)  # pdfplumber, tesseract, gemini_vision, docx
    raw_text_length = Column(Integer, nullable=True)
    raw_text = Column(Text, nullable=True)  # Full extracted text, stored for re-analysis
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())