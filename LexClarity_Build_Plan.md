# LexClarity — Complete Build Plan
## Indian Legal Contract Intelligence Platform

This document is the single source of truth for building LexClarity from zero. Every phase contains exact steps, exact file paths, exact commands, and a verification checklist that must pass before moving to the next phase. Do not skip verification steps — each phase depends on the previous one being correct.

---

## 0. Before You Start

### 0.1 Final Locked Decisions

| Decision | Value |
|---|---|
| Project name | LexClarity |
| Database | PostgreSQL (not SQLite) |
| Backend framework | FastAPI (Python 3.11) |
| Frontend framework | React + Tailwind CSS |
| Primary LLM | Groq (Llama 3.1 70B) |
| Fallback LLM | Gemini 1.5 Pro |
| Vector database | ChromaDB |
| Containerization | Docker + docker-compose |
| Admin theme | Dark glassmorphism, base color #0D518C |
| User theme | Light glassmorphism, base color #41C0F2 |
| UI layout | Bento grid |
| Languages at launch | English + Tamil |

### 0.2 Required Accounts and Keys (Get These Before Phase 1)

1. Groq API key — console.groq.com
2. Gemini API key — aistudio.google.com
3. A PostgreSQL instance — either local Docker container (recommended for dev) or a hosted instance
4. GitHub repository created (empty, for version control)

Do not proceed to Phase 1 until you physically have the Groq API key. Everything in Phase 3 depends on it.

### 0.3 Required Local Software

Verify each of these is installed before continuing:

```bash
python3 --version    # must be 3.11 or higher
node --version        # must be 18 or higher
docker --version      # must be 24 or higher
docker compose version
psql --version         # PostgreSQL client, for manual DB checks
```

If any command fails, install the missing tool before proceeding. Do not attempt to work around a missing dependency.

### 0.4 Final Project Folder Structure

This is the complete folder structure you are building toward. Refer back to this whenever you are unsure where a file belongs.

```
lexclarity/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── contract.py
│   │   │   ├── analysis.py
│   │   │   └── audit_log.py
│   │   ├── schemas/
│   │   │   ├── user_schema.py
│   │   │   ├── contract_schema.py
│   │   │   └── analysis_schema.py
│   │   ├── routers/
│   │   │   ├── auth_router.py
│   │   │   ├── contract_router.py
│   │   │   ├── analysis_router.py
│   │   │   ├── chat_router.py
│   │   │   ├── analytics_router.py
│   │   │   └── admin_router.py
│   │   ├── services/
│   │   │   ├── extraction_service.py
│   │   │   ├── ocr_service.py
│   │   │   ├── language_service.py
│   │   │   ├── segmentation_service.py
│   │   │   ├── dedup_service.py
│   │   │   ├── llm_service.py
│   │   │   ├── scoring_service.py
│   │   │   ├── bias_service.py
│   │   │   ├── rag_contract_service.py
│   │   │   ├── rag_chat_service.py
│   │   │   ├── compliance_service.py
│   │   │   ├── anomaly_service.py
│   │   │   ├── report_service.py
│   │   │   └── audit_service.py
│   │   ├── core/
│   │   │   ├── security.py
│   │   │   └── dependencies.py
│   │   └── utils/
│   │       └── hashing.py
│   ├── alembic/
│   │   └── versions/
│   └── tests/
│       ├── test_extraction.py
│       ├── test_llm_service.py
│       ├── test_scoring.py
│       └── test_rag.py
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── App.jsx
│   │   ├── themes/
│   │   │   ├── adminTheme.js
│   │   │   └── userTheme.js
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── UserDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ContractUpload.jsx
│   │   │   ├── AnalysisView.jsx
│   │   │   ├── History.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── LegalChat.jsx
│   │   ├── components/
│   │   │   ├── BentoCard.jsx
│   │   │   ├── HealthScoreCard.jsx
│   │   │   ├── BiasDetectorCard.jsx
│   │   │   ├── MissingClauseCard.jsx
│   │   │   ├── NegotiationPlaybookCard.jsx
│   │   │   ├── ClauseAnalysisTable.jsx
│   │   │   └── ChatWindow.jsx
│   │   └── api/
│   │       └── client.js
│
├── rag_knowledge_base/
│   ├── contract_rules/
│   │   ├── employment/
│   │   ├── vendor/
│   │   ├── lease/
│   │   ├── nda/
│   │   └── sla/
│   └── legal_documents/
│       ├── employment_acts/
│       ├── vendor_acts/
│       ├── lease_acts/
│       ├── ip_acts/
│       ├── dispute_acts/
│       └── case_law/
│
└── scripts/
    ├── ingest_knowledge_base.py
    └── seed_admin_user.py
```

---

## PHASE 1 — Project Setup, Database, Authentication, Text Extraction

### Goal Of This Phase

By the end of Phase 1, you can upload a PDF/DOCX/TXT file through an API endpoint, get real extracted text back, and log in as a user with a JWT token. No LLM calls happen yet. No ML happens yet. This phase is pure infrastructure.

### Step 1.1 — Initialize the Repository

```bash
mkdir lexclarity && cd lexclarity
git init
mkdir backend frontend rag_knowledge_base scripts
```

Create `.gitignore` in the root:

```
__pycache__/
*.pyc
.env
node_modules/
dist/
build/
*.db
.DS_Store
venv/
chroma_db/
```

**Verify:** Run `git status` — confirm you are in a clean git repo with the folders created.

### Step 1.2 — Backend Python Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

Create `requirements.txt`:

```
fastapi==0.111.0
uvicorn[standard]==0.30.0
sqlalchemy==2.0.30
psycopg2-binary==2.9.9
alembic==1.13.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
pydantic==2.7.1
pydantic-settings==2.2.1
pdfplumber==0.11.0
python-docx==1.1.2
pytesseract==0.3.10
pdf2image==1.17.0
Pillow==10.3.0
langdetect==1.0.9
lingua-language-detector==2.0.2
spacy==3.7.4
sentence-transformers==2.7.0
chromadb==0.5.0
groq==0.9.0
google-generativeai==0.5.4
reportlab==4.2.0
scikit-learn==1.4.2
numpy==1.26.4
python-dotenv==1.0.1
```

Install:

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

**Verify:** Run `python -c "import fastapi, sqlalchemy, spacy, sentence_transformers, chromadb, groq; print('all imports ok')"` — must print `all imports ok` with no errors. If any import fails, stop and fix it before continuing. Do not proceed with a broken environment.

### Step 1.3 — Environment Configuration

Create `.env.example` in the project root:

```
DATABASE_URL=postgresql://lexuser:lexpassword@db:5432/lexclarity_db
JWT_SECRET_KEY=change_this_to_a_random_64_char_string
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=120
GROQ_API_KEY=your_groq_key_here
GEMINI_API_KEY=your_gemini_key_here
CHROMA_DB_PATH=/app/chroma_db
TESSERACT_CMD=/usr/bin/tesseract
ENVIRONMENT=development
```

Copy to `.env` and fill in your real Groq and Gemini keys. Generate a real JWT secret:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Paste that output as `JWT_SECRET_KEY`.

**Verify:** Confirm `.env` exists, is filled with real values, and is listed in `.gitignore` (check it does NOT show up in `git status`).

### Step 1.4 — Config Module

Create `backend/app/config.py`:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 120
    groq_api_key: str
    gemini_api_key: str
    chroma_db_path: str = "./chroma_db"
    tesseract_cmd: str = "/usr/bin/tesseract"
    environment: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
```

**Verify:** Run `python -c "from app.config import settings; print(settings.database_url)"` from inside `backend/` — must print your database URL with no error.

### Step 1.5 — PostgreSQL via Docker (Local Dev)

Create `docker-compose.yml` in the project root (full version, used from this point forward):

```yaml
version: "3.9"

services:
  db:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_USER: lexuser
      POSTGRES_PASSWORD: lexpassword
      POSTGRES_DB: lexclarity_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lexuser"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://lexuser:lexpassword@db:5432/lexclarity_db
    env_file:
      - .env
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - ./rag_knowledge_base:/app/rag_knowledge_base
      - chroma_data:/app/chroma_db

  frontend:
    build: ./frontend
    restart: always
    depends_on:
      - backend
    ports:
      - "3000:80"

volumes:
  pgdata:
  chroma_data:
```

Start only the database for now to test Phase 1:

```bash
docker compose up -d db
```

**Verify:** Run `docker compose ps` — `db` must show `healthy`. Then run:

```bash
docker exec -it lexclarity-db-1 psql -U lexuser -d lexclarity_db -c "SELECT 1;"
```

Must return `1`. If it does not connect, stop here and fix the database before continuing — nothing else in this project works without it.

### Step 1.6 — Database Models

Create `backend/app/database.py`:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Create `backend/app/models/user.py`:

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # "user" or "admin"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

Create `backend/app/models/contract.py`:

```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
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
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
```

Create `backend/app/models/analysis.py`:

```python
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
```

Create `backend/app/models/audit_log.py`:

```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    file_hash = Column(String, nullable=True)
    details = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

### Step 1.7 — Alembic Migrations (Do Not Use create_all In Production)

```bash
cd backend
alembic init alembic
```

Edit `alembic.ini` — set `sqlalchemy.url` to read from environment instead of hardcoding. Edit `alembic/env.py` to import your models:

```python
from app.database import Base
from app.models import user, contract, analysis, audit_log
target_metadata = Base.metadata
```

Generate and run the first migration:

```bash
alembic revision --autogenerate -m "initial tables"
alembic upgrade head
```

**Verify:** Connect to Postgres and confirm tables exist:

```bash
docker exec -it lexclarity-db-1 psql -U lexuser -d lexclarity_db -c "\dt"
```

Must list `users`, `contracts`, `analyses`, `audit_logs`. If any table is missing, do not proceed — check the alembic migration file for errors.

### Step 1.8 — Authentication

Create `backend/app/core/security.py`:

```python
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
```

Create `backend/app/core/dependencies.py`:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = decode_access_token(token)
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
```

Create `backend/app/routers/auth_router.py` with `/register` and `/login` endpoints following standard FastAPI OAuth2 password flow patterns, returning a JWT on successful login.

**Verify:** Start the backend locally (`uvicorn app.main:app --reload`), register a test user via `/auth/register`, log in via `/auth/login`, confirm you receive a JWT token, and confirm calling a protected endpoint with that token succeeds while calling it without a token returns 401.

### Step 1.9 — Text Extraction Service

Create `backend/app/services/extraction_service.py` implementing this exact logic:

```python
import pdfplumber
from docx import Document as DocxDocument

def extract_text(file_path: str, file_type: str) -> dict:
    """
    Returns: {
        "text": str,
        "method": "pdfplumber" | "docx" | "needs_ocr",
        "pages": int,
        "avg_chars_per_page": float
    }
    """
    if file_type == "txt":
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
        return {"text": text, "method": "txt", "pages": 1, "avg_chars_per_page": len(text)}

    if file_type == "docx":
        doc = DocxDocument(file_path)
        text = "\n".join(p.text for p in doc.paragraphs)
        return {"text": text, "method": "docx", "pages": 1, "avg_chars_per_page": len(text)}

    if file_type == "pdf":
        full_text = ""
        with pdfplumber.open(file_path) as pdf:
            num_pages = len(pdf.pages)
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                full_text += page_text + "\n"

        avg_chars = len(full_text) / max(num_pages, 1)

        if avg_chars < 100:
            return {"text": full_text, "method": "needs_ocr", "pages": num_pages, "avg_chars_per_page": avg_chars}

        return {"text": full_text, "method": "pdfplumber", "pages": num_pages, "avg_chars_per_page": avg_chars}

    raise ValueError(f"Unsupported file type: {file_type}")
```

Create `backend/app/services/ocr_service.py` implementing the Tesseract + Gemini Vision fallback chain described in the architecture: convert PDF pages to images with `pdf2image`, run `pytesseract` with `lang="eng+tam"`, compute average confidence from `pytesseract.image_to_data`, and if confidence is below 60, call Gemini Vision on that page image as a fallback.

**Verify:** Create three test files — a digital PDF, a DOCX, and a scanned/image-based PDF (you can simulate this by screenshotting a page of text and putting it in a PDF). Run each through `extract_text`. Confirm: digital PDF returns method `pdfplumber` with real text. DOCX returns method `docx` with real text. Scanned PDF returns method `needs_ocr`, and when passed to the OCR service, returns real extracted text with a confidence score.

### Step 1.10 — Contract Upload Endpoint

Create `backend/app/routers/contract_router.py` with a `POST /contracts/upload` endpoint that: accepts a file upload, computes SHA-256 hash via `backend/app/utils/hashing.py`, saves the file temporarily, calls `extract_text`, calls OCR service if needed, stores a `Contract` row in Postgres, logs an `AuditLog` entry with action `"upload"`, and returns the contract ID and extracted text length.

**Verify:** Upload all three test files via this endpoint using an authenticated request. Confirm a row appears in the `contracts` table for each, and a corresponding row appears in `audit_logs`. Query Postgres directly to confirm:

```bash
docker exec -it lexclarity-db-1 psql -U lexuser -d lexclarity_db -c "SELECT id, filename, extraction_method FROM contracts;"
```

### Phase 1 Final Checklist

Do not move to Phase 2 until every item below is true.

- [ ] `docker compose up -d db` starts Postgres and it reports healthy
- [ ] Alembic migrations ran successfully, all 4 tables exist
- [ ] User registration and login work, JWT is issued and validated
- [ ] Protected endpoints reject requests without a valid token
- [ ] Digital PDF extraction returns real text via pdfplumber
- [ ] DOCX extraction returns real text
- [ ] Scanned PDF correctly triggers OCR path and returns real text
- [ ] Every upload creates a `Contract` row and an `AuditLog` row in Postgres
- [ ] SHA-256 hash is correctly computed and stored per file

---

## PHASE 2 — NLP Pipeline: Language Detection, Segmentation, Deduplication

### Goal Of This Phase

Take the raw extracted text from Phase 1 and turn it into a clean list of unique, classified, language-tagged clauses ready for LLM analysis. No LLM calls happen in this phase. This is pure NLP/ML.

### Step 2.1 — Language Detection Service

Create `backend/app/services/language_service.py`:

```python
from lingua import Language, LanguageDetectorBuilder

detector = LanguageDetectorBuilder.from_languages(
    Language.ENGLISH, Language.TAMIL, Language.HINDI
).build()

def detect_clause_language(text: str) -> str:
    result = detector.detect_language_of(text)
    if result is None:
        return "unknown"
    return result.name.lower()
```

**Verify:** Write a quick test script that runs this function on three sample strings — one clearly English, one clearly Tamil, one clearly Hindi. Confirm each returns the correct language. This must pass before continuing — if language detection is wrong, every downstream step processes text incorrectly.

### Step 2.2 — Clause Segmentation Service

Create `backend/app/services/segmentation_service.py`:

```python
import spacy
from indicnlp.tokenize import sentence_tokenize

nlp_en = spacy.load("en_core_web_sm")

def segment_english(text: str) -> list[str]:
    doc = nlp_en(text)
    clauses = [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 15]
    return clauses

def segment_tamil(text: str) -> list[str]:
    sentences = sentence_tokenize.sentence_split(text, lang='ta')
    clauses = [s.strip() for s in sentences if len(s.strip()) > 15]
    return clauses

def segment_by_language(text: str, language: str) -> list[str]:
    if language == "tamil":
        return segment_tamil(text)
    return segment_english(text)
```

The 15-character minimum filters out page numbers, headers, and fragment noise that would otherwise be sent to the LLM as fake clauses.

**Verify:** Run this on a real multi-paragraph English contract sample and a real Tamil contract sample. Manually inspect the output list — confirm clauses are complete sentences, not cut off mid-thought, and that page headers/footers are not appearing as clauses. If segmentation looks wrong, adjust the character threshold or check that the correct spaCy model loaded.

### Step 2.3 — Named Entity Extraction (Bonus Metadata)

Within the same segmentation service, add a function using spaCy's NER to extract party names, dates, and monetary values per clause — these get stored as metadata alongside each clause and are surfaced in the UI later.

```python
def extract_entities(clause: str) -> dict:
    doc = nlp_en(clause)
    return {
        "parties": [ent.text for ent in doc.ents if ent.label_ in ("ORG", "PERSON")],
        "dates": [ent.text for ent in doc.ents if ent.label_ == "DATE"],
        "money": [ent.text for ent in doc.ents if ent.label_ == "MONEY"]
    }
```

**Verify:** Run on a clause containing a clear date and monetary value ("Payment of ₹50,000 shall be made within 30 days"). Confirm the date and money entities are correctly extracted.

### Step 2.4 — TF-IDF Section Classifier

Create a small labeled training set (50-100 example clauses you write by hand, each tagged with a section type: payment, termination, ip, liability, confidentiality, non_compete, probation, maintenance, warranty, other). Save as `backend/app/ml_data/section_training_data.json`.

Create `backend/app/services/section_classifier.py`:

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import json
import joblib
import os

MODEL_PATH = "app/ml_data/section_classifier.joblib"
VECTORIZER_PATH = "app/ml_data/tfidf_vectorizer.joblib"

def train_section_classifier():
    with open("app/ml_data/section_training_data.json") as f:
        data = json.load(f)

    texts = [d["clause"] for d in data]
    labels = [d["section_type"] for d in data]

    vectorizer = TfidfVectorizer(max_features=500, ngram_range=(1, 2))
    X = vectorizer.fit_transform(texts)

    clf = LogisticRegression(max_iter=1000)
    clf.fit(X, labels)

    joblib.dump(clf, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)

def classify_section(clause: str) -> str:
    if not os.path.exists(MODEL_PATH):
        train_section_classifier()
    clf = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    X = vectorizer.transform([clause])
    return clf.predict(X)[0]
```

**Verify:** Run `classify_section` on 10 clauses you did NOT include in training data. Manually check that at least 7 out of 10 are classified correctly. This is a deliberately small bootstrap model — it improves over time as more contracts are analyzed and you expand the training set. Do not expect perfection here; this is a routing aid for the LLM, not the final risk decision.

### Step 2.5 — SBERT Embedding and Deduplication Service

Create `backend/app/services/dedup_service.py`:

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

def embed_clauses(clauses: list[str]) -> np.ndarray:
    return model.encode(clauses, convert_to_numpy=True)

def deduplicate_clauses(clauses: list[str], similarity_threshold: float = 0.92) -> dict:
    """
    Returns: {
        "unique_clauses": list[str],
        "duplicate_map": dict  # maps duplicate index -> representative index
    }
    """
    if len(clauses) == 0:
        return {"unique_clauses": [], "duplicate_map": {}}

    embeddings = embed_clauses(clauses)
    norm_embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
    similarity_matrix = np.dot(norm_embeddings, norm_embeddings.T)

    unique_indices = []
    duplicate_map = {}
    assigned = set()

    for i in range(len(clauses)):
        if i in assigned:
            continue
        unique_indices.append(i)
        assigned.add(i)
        for j in range(i + 1, len(clauses)):
            if j in assigned:
                continue
            if similarity_matrix[i][j] >= similarity_threshold:
                duplicate_map[j] = i
                assigned.add(j)

    unique_clauses = [clauses[i] for i in unique_indices]
    return {"unique_clauses": unique_clauses, "duplicate_map": duplicate_map, "unique_indices": unique_indices}
```

**Verify:** Test with a list containing 3 genuinely different clauses and 2 that are reworded versions of clause 1 (same meaning, different words). Confirm the deduplication correctly groups the 2 reworded versions with clause 1, returning only 3 unique clauses. Print the similarity scores to manually sanity-check the threshold of 0.92 is appropriate — adjust if real contract data shows it's too strict or too loose.

### Step 2.6 — Wire It All Together: The Preprocessing Pipeline

Create `backend/app/services/preprocessing_pipeline.py` that calls, in this exact order: extraction (Phase 1) → language detection per paragraph → segmentation by detected language → entity extraction → TF-IDF section classification → SBERT deduplication. Output is a clean list of unique clause objects, each with: text, language, section_type, entities, and a flag marking it as a deduplication representative (with a count of how many duplicates it represents).

**Verify:** Run a complete real contract (a real or realistic vendor agreement, at least 2 pages) through this full pipeline end to end. Print the final clause list. Manually check: every clause is a real, complete sentence; languages are correctly tagged; section types look reasonable; duplicate boilerplate clauses (like a standard confidentiality footer repeated in two places) are correctly merged into one. Count how many clauses went in vs how many unique clauses came out — confirm deduplication actually reduced the count on a contract with repeated language.

### Phase 2 Final Checklist

- [ ] Language detection correctly distinguishes English, Tamil, Hindi on test strings
- [ ] English segmentation produces complete sentences, not fragments
- [ ] Tamil segmentation produces complete sentences, not fragments
- [ ] Entity extraction correctly pulls dates and money values from test clauses
- [ ] TF-IDF classifier correctly classifies at least 70% of held-out test clauses
- [ ] SBERT deduplication correctly identifies reworded duplicate clauses
- [ ] Full pipeline run on a real contract produces a clean, deduplicated, classified clause list
- [ ] You have manually inspected the output and it looks correct, not just "ran without crashing"

---

## PHASE 3 — LLM Integration, Structured Analysis, Scoring Models

### Goal Of This Phase

Every unique clause from Phase 2 is sent to Groq (with Gemini fallback), returns a validated structured JSON response, and gets aggregated into a contract health score and bias percentage. This is where the actual intelligence happens.

### Step 3.1 — LLM Service With Structured Schema and Retry

Create `backend/app/services/llm_service.py`:

```python
from groq import Groq
import google.generativeai as genai
import json
from app.config import settings

groq_client = Groq(api_key=settings.groq_api_key)
genai.configure(api_key=settings.gemini_api_key)

ANALYSIS_SCHEMA_PROMPT = """
You are a contract clause risk analyzer for Indian commercial law.
Analyze the following clause and respond with ONLY valid JSON, no other text, in this exact schema:

{
  "risk_level": "Low" | "Medium" | "High",
  "confidence": <float 0.0 to 1.0>,
  "risk_reasoning": "<one sentence explanation>",
  "bias_label": "favours_party_a" | "favours_party_b" | "neutral",
  "bias_confidence": <float 0.0 to 1.0>,
  "alternative_clause": "<a fairer rewritten version of this clause>",
  "alternative_reasoning": "<why this alternative is better>"
}

Clause: "{clause_text}"
Contract type: {contract_type}
Section: {section_type}
"""

def analyze_clause_with_groq(clause_text: str, contract_type: str, section_type: str) -> dict:
    prompt = ANALYSIS_SCHEMA_PROMPT.format(
        clause_text=clause_text, contract_type=contract_type, section_type=section_type
    )
    response = groq_client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )
    raw = response.choices[0].message.content.strip()
    return json.loads(raw)

def analyze_clause_with_gemini(clause_text: str, contract_type: str, section_type: str) -> dict:
    prompt = ANALYSIS_SCHEMA_PROMPT.format(
        clause_text=clause_text, contract_type=contract_type, section_type=section_type
    )
    model = genai.GenerativeModel("gemini-1.5-pro")
    response = model.generate_content(prompt)
    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.strip("`").replace("json", "", 1).strip()
    return json.loads(raw)

REQUIRED_KEYS = {"risk_level", "confidence", "risk_reasoning", "bias_label",
                 "bias_confidence", "alternative_clause", "alternative_reasoning"}

def validate_schema(result: dict) -> bool:
    if not REQUIRED_KEYS.issubset(result.keys()):
        return False
    if result["risk_level"] not in ("Low", "Medium", "High"):
        return False
    if result["bias_label"] not in ("favours_party_a", "favours_party_b", "neutral"):
        return False
    if not (0.0 <= result["confidence"] <= 1.0):
        return False
    return True

def analyze_clause(clause_text: str, contract_type: str, section_type: str) -> dict:
    """
    Tries Groq first, retries once, falls back to Gemini, retries once.
    If everything fails, returns a flagged failure object — never returns fake data.
    """
    for attempt_fn in [analyze_clause_with_groq, analyze_clause_with_groq,
                       analyze_clause_with_gemini, analyze_clause_with_gemini]:
        try:
            result = attempt_fn(clause_text, contract_type, section_type)
            if validate_schema(result):
                return {**result, "analysis_failed": False}
        except Exception:
            continue

    return {
        "risk_level": None,
        "confidence": 0.0,
        "risk_reasoning": "Analysis failed after retries",
        "bias_label": None,
        "bias_confidence": 0.0,
        "alternative_clause": None,
        "alternative_reasoning": None,
        "analysis_failed": True
    }
```

This is the single most important piece of code in the entire project for honesty: it never invents a fake result. If both LLMs fail twice each, it returns an explicit failure flag that the UI must show to the user as "could not analyze — review manually."

**Verify:** Run `analyze_clause` on 5 real clauses of different risk levels (write one that's obviously high risk, one obviously low risk, etc). Manually check the JSON response makes sense for each. Then deliberately break it — pass an invalid Groq API key temporarily and confirm it correctly falls back to Gemini. Then break both keys and confirm it returns the `analysis_failed: True` object instead of crashing or returning nonsense.

### Step 3.2 — Weighted Health Scoring Service

Create `backend/app/services/scoring_service.py`:

```python
def compute_health_score(clause_results: list[dict]) -> dict:
    """
    clause_results: list of dicts from analyze_clause, excluding failed ones from scoring
    """
    valid_results = [r for r in clause_results if not r.get("analysis_failed")]

    if len(valid_results) == 0:
        return {"health_score": None, "high_count": 0, "medium_count": 0, "low_count": 0}

    weight_map = {"High": 3, "Medium": 1, "Low": 0}
    total_weighted = 0
    high_count = medium_count = low_count = 0

    for r in valid_results:
        weight = weight_map.get(r["risk_level"], 0)
        confidence = r.get("confidence", 0.5)
        total_weighted += weight * confidence

        if r["risk_level"] == "High":
            high_count += 1
        elif r["risk_level"] == "Medium":
            medium_count += 1
        else:
            low_count += 1

    max_possible = 3 * len(valid_results)
    risk_ratio = total_weighted / max_possible if max_possible > 0 else 0
    health_score = round(100 - (risk_ratio * 100), 1)

    return {
        "health_score": health_score,
        "high_count": high_count,
        "medium_count": medium_count,
        "low_count": low_count,
        "analyzed_count": len(valid_results),
        "failed_count": len(clause_results) - len(valid_results)
    }
```

**Verify:** Manually construct a test list of clause results — one all-Low set should produce a health score near 100, one all-High-at-100%-confidence set should produce a health score near 0. Run the function and confirm the math behaves as expected at both extremes and at a realistic mixed set.

### Step 3.3 — Bias Quantification Service

Create `backend/app/services/bias_service.py`:

```python
def compute_bias_distribution(clause_results: list[dict]) -> dict:
    valid_results = [r for r in clause_results if not r.get("analysis_failed")]

    if len(valid_results) == 0:
        return {"buyer_pct": 0, "vendor_pct": 0, "neutral_pct": 100}

    buyer_score = sum(r["bias_confidence"] for r in valid_results if r["bias_label"] == "favours_party_a")
    vendor_score = sum(r["bias_confidence"] for r in valid_results if r["bias_label"] == "favours_party_b")
    neutral_score = sum(r["bias_confidence"] for r in valid_results if r["bias_label"] == "neutral")

    total = buyer_score + vendor_score + neutral_score
    if total == 0:
        return {"buyer_pct": 0, "vendor_pct": 0, "neutral_pct": 100}

    return {
        "buyer_pct": round((buyer_score / total) * 100, 1),
        "vendor_pct": round((vendor_score / total) * 100, 1),
        "neutral_pct": round((neutral_score / total) * 100, 1)
    }
```

**Verify:** Test with a constructed list where 8 clauses favour party A and 2 favour party B. Confirm the output percentages roughly reflect that skew, weighted by confidence.

### Step 3.4 — Analysis Orchestration Endpoint

Create `backend/app/routers/analysis_router.py` with `POST /analysis/run/{contract_id}` that: loads the contract's preprocessed clauses (calling the Phase 2 pipeline if not already done), calls `analyze_clause` for every unique clause (consider using `asyncio.gather` with a concurrency limit of 5 to avoid rate limits), computes the health score and bias distribution, stores everything in the `Analysis` table, and logs an audit entry.

**Verify:** Run this full endpoint on a real uploaded contract from Phase 1. Confirm an `Analysis` row appears in Postgres with a populated `health_score`, bias percentages, and a `clause_results` JSON blob containing every clause's full analysis. Manually read through the JSON output for at least 5 clauses and confirm the risk levels and alternative clauses are sensible, not generic placeholder text.

### Phase 3 Final Checklist

- [ ] Groq returns valid structured JSON for real test clauses
- [ ] Gemini fallback correctly triggers when Groq fails (tested with a broken key)
- [ ] Schema validation correctly rejects malformed LLM responses
- [ ] Failed analysis after all retries returns the explicit failure object, never fake data
- [ ] Health score math is verified correct at both extremes and a realistic middle case
- [ ] Bias distribution percentages sum to 100 and reflect the actual skew in test data
- [ ] Full analysis run on a real contract produces sensible, non-generic clause-level output
- [ ] Analysis results are correctly persisted to Postgres

---

## PHASE 4A — Contract Analysis RAG (Missing Clauses + Negotiation Playbook)

### Goal Of This Phase

Build the Indian law knowledge base for contract rules, embed it into ChromaDB, and wire retrieval into two features: Missing Clause Detection and the Negotiation Playbook.

### Step 4A.1 — Author The Knowledge Base Content

Before any code, you must write the actual content files. This is not optional and cannot be skipped — RAG without real knowledge base content is just an empty retrieval call.

For each contract type folder under `rag_knowledge_base/contract_rules/`, create `mandatory_clauses.md` and `negotiation_playbook.md`. Each entry inside these files must follow this exact structure so the chunking step in 4A.2 works correctly:

```markdown
## Clause: Notice Period for Termination
Act: Industrial Disputes Act 1947, Section 25F
Contract type: employment
Requirement: Employees with 1+ year of continuous service must receive
either one month's written notice or wages in lieu, plus retrenchment
compensation of 15 days' average pay per completed year of service.
Standard counter-clause: "Either party may terminate this agreement by
providing thirty (30) days written notice, except in cases of proven
misconduct as defined in Clause X."
```

Write a minimum of 15 such entries per contract type before moving on. Fewer than this and Missing Clause Detection will have too many blind spots to be useful.

**Verify:** Open every markdown file and read it top to bottom. Confirm every entry has all four fields (Clause, Act, Requirement, Standard counter-clause) filled in with real, accurate content — not placeholders. If you are not confident about a legal requirement's accuracy, mark it clearly as `[NEEDS LEGAL REVIEW]` rather than guessing, so it is not silently used to mislead a user later.

### Step 4A.2 — Chunking and Ingestion Script

Create `scripts/ingest_knowledge_base.py`:

```python
import os
import re
import chromadb
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection("contract_analysis_rag")

def parse_markdown_entries(filepath: str, contract_type: str, doc_category: str) -> list[dict]:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    entries = content.split("## Clause:")[1:]
    parsed = []
    for entry in entries:
        title_line, *rest = entry.strip().split("\n", 1)
        body = rest[0] if rest else ""
        parsed.append({
            "title": title_line.strip(),
            "text": "## Clause:" + entry.strip(),
            "contract_type": contract_type,
            "category": doc_category
        })
    return parsed

def ingest():
    base_path = "rag_knowledge_base/contract_rules"
    doc_id = 0
    for contract_type in os.listdir(base_path):
        type_path = os.path.join(base_path, contract_type)
        if not os.path.isdir(type_path):
            continue
        for filename in os.listdir(type_path):
            doc_category = "mandatory_clauses" if "mandatory" in filename else "negotiation_playbook"
            entries = parse_markdown_entries(os.path.join(type_path, filename), contract_type, doc_category)
            for entry in entries:
                embedding = model.encode(entry["text"]).tolist()
                collection.add(
                    ids=[f"doc_{doc_id}"],
                    embeddings=[embedding],
                    documents=[entry["text"]],
                    metadatas=[{
                        "title": entry["title"],
                        "contract_type": entry["contract_type"],
                        "category": entry["category"]
                    }]
                )
                doc_id += 1
    print(f"Ingested {doc_id} entries into contract_analysis_rag")

if __name__ == "__main__":
    ingest()
```

Run it:

```bash
cd backend
python ../scripts/ingest_knowledge_base.py
```

**Verify:** The script must print a count matching roughly the number of entries you wrote (15+ per contract type × 5 contract types × 2 files = 150+ minimum). Then write a quick standalone test that queries the collection with a sample question like "what notice period is required for employee termination" and confirms it retrieves the relevant employment termination entry with a reasonable similarity score (above 0.6).

### Step 4A.3 — Missing Clause Detection Service

Create `backend/app/services/rag_contract_service.py`:

```python
import chromadb
from sentence_transformers import SentenceTransformer
from app.services.llm_service import groq_client
import json

model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_collection("contract_analysis_rag")

def retrieve_mandatory_clauses(contract_type: str, top_k: int = 10) -> list[dict]:
    query_embedding = model.encode(f"mandatory clauses for {contract_type} contracts").tolist()
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"$and": [{"contract_type": contract_type}, {"category": "mandatory_clauses"}]}
    )
    return [
        {"text": doc, "title": meta["title"]}
        for doc, meta in zip(results["documents"][0], results["metadatas"][0])
    ]

def detect_missing_clauses(present_clauses: list[str], contract_type: str) -> list[dict]:
    requirements = retrieve_mandatory_clauses(contract_type)
    requirements_text = "\n\n".join(r["text"] for r in requirements)
    present_text = "\n".join(present_clauses[:50])  # cap to avoid token overflow

    prompt = f"""
Given the following list of MANDATORY requirements under Indian law for a
{contract_type} contract, and the list of clauses ACTUALLY PRESENT in a
contract, identify which mandatory requirements are MISSING.

MANDATORY REQUIREMENTS:
{requirements_text}

CLAUSES PRESENT IN CONTRACT:
{present_text}

Respond with ONLY a JSON array, each item in this schema:
{{"missing_requirement": "<title>", "law_reference": "<act and section>", "severity": "critical" | "recommended"}}

If nothing is missing, respond with an empty array [].
"""
    response = groq_client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
    )
    raw = response.choices[0].message.content.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return []
```

**Verify:** Take a real test contract that you know is missing a specific mandatory clause (for example, an employment contract you wrote without any POSH Act reference). Run it through `detect_missing_clauses`. Confirm the POSH Act gap is correctly identified with the right law reference. This is your ground-truth test — if it misses an obvious gap you planted, something in retrieval or the prompt is broken and must be fixed before trusting this feature.

### Step 4A.4 — Negotiation Playbook Service

Create the equivalent retrieval and generation function for the negotiation playbook, following the same retrieve-then-generate pattern but querying the `negotiation_playbook` category and asking the LLM to categorize flagged high/medium risk clauses into must-fix, should-negotiate, and accept-as-is buckets, grounded in the retrieved counter-clause language.

**Verify:** Run on the same test contract's flagged High risk clauses. Confirm the generated playbook entries cite real law sections from your knowledge base (not generic LLM knowledge) and that the counter-clause wording matches or closely follows what you wrote in `negotiation_playbook.md`.

### Phase 4A Final Checklist

- [ ] Knowledge base markdown files contain real, reviewed legal content, minimum 15 entries per contract type per file
- [ ] Ingestion script runs successfully and reports a sensible entry count
- [ ] A manual retrieval test against a known question returns the correct entry with good similarity
- [ ] Missing Clause Detection correctly catches a deliberately planted gap in a test contract
- [ ] Negotiation Playbook output cites your knowledge base content, not generic advice
- [ ] Both features are wired into the analysis endpoint and persist results to the `Analysis` table

---

## PHASE 4B — Legal Knowledge Chatbot RAG

### Goal Of This Phase

A separate RAG pipeline grounded in full Indian Act texts and case law, answering free-form user questions with citations and refusing to answer when retrieval confidence is too low.

### Step 4B.1 — Collect and Organize Legal PDFs

Populate `rag_knowledge_base/legal_documents/` with real Act PDFs sourced from indiacode.nic.in and legislative.gov.in, organized into the subfolders already defined in the project structure (employment_acts, vendor_acts, lease_acts, ip_acts, dispute_acts, case_law).

**Verify:** Before writing any ingestion code, open every PDF and confirm it is the correct, current Act and that the PDF actually contains selectable/extractable text (not a low-quality scan with no OCR layer). A corrupted or scanned-without-OCR source PDF will silently produce garbage chunks later — catch this now by visual inspection.

### Step 4B.2 — Section-Aware Chunking Script

Create `scripts/chunk_legal_documents.py` that extracts text from each PDF using `pdfplumber` (falling back to the Phase 1 OCR service for any scanned Acts), then splits the text using a regex pattern matching Indian legal section markers (e.g. `r"Section\s+\d+[A-Z]*\."` or `r"\d+\.\s"` depending on the Act's formatting), attaching metadata (act name, section number, year, category, jurisdiction, amended flag) to every chunk. Never split mid-sentence — if a regex match point falls inside what is clearly one continuous sentence, adjust the split point to the nearest full stop.

**Verify:** Manually inspect at least 20 chunks across different Acts after running this script. Confirm each chunk represents one coherent legal section, that metadata fields are correctly populated, and that no chunk cuts a sentence in half. This manual review step cannot be skipped — bad chunking is the single most common cause of misleading RAG answers.

### Step 4B.3 — Embed and Ingest Into ChromaDB

Extend the ingestion approach from 4A.2 to create a second collection, `legal_knowledge_base`, embedding every verified chunk from Step 4B.2 with the same SBERT model, storing the full metadata set per chunk.

**Verify:** Query this collection directly with 5 manually written test questions spanning different Acts (one employment, one vendor/MSMED, one lease, one IP, one dispute resolution). For each, confirm the top retrieved chunk is genuinely relevant and check its similarity score.

### Step 4B.4 — RAG Chat Service With Guardrails

Create `backend/app/services/rag_chat_service.py` implementing exactly the guardrail logic specified in the architecture discussion:

```python
import chromadb
from sentence_transformers import SentenceTransformer
from app.services.llm_service import groq_client

model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
client = chromadb.PersistentClient(path="./chroma_db")
legal_collection = client.get_collection("legal_knowledge_base")

SIMILARITY_THRESHOLD = 0.65

SYSTEM_PROMPT = """
You are a legal information assistant. You MUST answer using ONLY the
provided document excerpts below. Do NOT use any information from your
own training data or general knowledge. If the excerpts do not contain
enough information to answer the question, explicitly say so rather
than guessing.

Always end your answer with the exact source citations (Act name and
section number) for every excerpt you used.

If any excerpt is marked as amended, mention this and note the user
should verify the current version applies.

If any excerpt is jurisdiction-specific (e.g. Tamil Nadu), mention that
the answer may differ in other states.
"""

def answer_legal_question(question: str) -> dict:
    query_embedding = model.encode(question).tolist()
    results = legal_collection.query(query_embeddings=[query_embedding], n_results=5)

    if not results["distances"][0] or (1 - results["distances"][0][0]) < SIMILARITY_THRESHOLD:
        return {
            "answer": "I could not find relevant information in the legal document base for this question. Please consult a qualified lawyer.",
            "sources": [],
            "low_confidence": True
        }

    excerpts = []
    sources = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        excerpts.append(doc)
        sources.append(f"{meta['act']} — Section {meta['section']}")

    excerpts_text = "\n\n---\n\n".join(excerpts)
    full_prompt = f"{SYSTEM_PROMPT}\n\nDocument excerpts:\n{excerpts_text}\n\nQuestion: {question}"

    response = groq_client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[{"role": "user", "content": full_prompt}],
        temperature=0.1,
    )

    return {
        "answer": response.choices[0].message.content.strip(),
        "sources": sources,
        "low_confidence": False
    }
```

**Verify:** This is the highest-stakes verification step in the entire project. Test with at least 10 real questions:

5 questions you know the answer to and that ARE covered in your knowledge base — confirm the answer is accurate and cites the correct section.

3 questions that are NOT covered in your knowledge base at all (ask about something completely unrelated, like criminal law if you only ingested commercial/employment Acts) — confirm the system correctly refuses to answer rather than guessing from the LLM's general training knowledge.

2 trick questions where the literal words might match a chunk via embedding similarity but the actual legal meaning is different — confirm the system does not produce a misleading answer. If it does, lower the similarity threshold or improve chunk metadata filtering.

Do not proceed to Phase 5 until all 10 of these manual tests behave correctly. This is the feature most likely to mislead a real user if shipped with bugs.

### Step 4B.5 — Chat Endpoint and History

Create `backend/app/routers/chat_router.py` with a `POST /chat/ask` endpoint storing every question/answer pair with sources in a new `chat_history` table (add this model and run another alembic migration), so users can scroll back through past legal questions.

**Verify:** Ask 3 questions through the live endpoint, confirm all 3 are persisted in Postgres with their sources, and confirm a `GET /chat/history` endpoint correctly returns them in order.

### Phase 4B Final Checklist

- [ ] All legal PDFs are verified as correct, current, and text-extractable before ingestion
- [ ] Chunking manually verified as section-coherent on 20+ sample chunks
- [ ] All 10 manual guardrail test questions behave correctly, especially the 3 out-of-scope refusals
- [ ] Every answer includes accurate source citations
- [ ] Low confidence retrieval correctly triggers the refusal response, never a guess
- [ ] Chat history persists correctly to Postgres

---

## PHASE 5 — React Frontend (Dual Theme, Bento Grid, Glassmorphism)

### Goal Of This Phase

A working UI for both admin and user roles, consuming every backend endpoint built so far.

### Step 5.1 — Project Scaffolding

```bash
cd frontend
npm create vite@latest . -- --template react
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install axios react-router-dom recharts lucide-react
```

Configure `tailwind.config.js` to scan `./src/**/*.{js,jsx}` and extend the theme with your two color bases (`#0D518C` for admin, `#41C0F2` for user) as custom Tailwind colors.

**Verify:** Run `npm run dev`, confirm the default Vite page loads in the browser with Tailwind classes visibly applying (test by adding a `bg-blue-500` div temporarily).

### Step 5.2 — API Client and Auth Flow

Create `frontend/src/api/client.js` using `axios` with an interceptor that attaches the JWT from local storage (or in-memory state, never localStorage per artifact rules if this were inside Claude — but this is a real standalone project so localStorage is fine here) to every request, and redirects to login on a 401.

Build `Login.jsx` calling `/auth/login`, storing the token and decoded role, then routing to `AdminDashboard` or `UserDashboard` based on role.

**Verify:** Log in as your admin test user, confirm redirect to admin dashboard. Log in as a regular test user, confirm redirect to user dashboard. Confirm an expired/invalid token correctly redirects back to login.

### Step 5.3 — Build Each Page in This Order

Build and manually test each page before moving to the next — do not build all pages and test at the end.

1. `ContractUpload.jsx` — file upload form calling `/contracts/upload`, showing extraction method and a "Run Analysis" button calling `/analysis/run/{id}`.
2. `AnalysisView.jsx` — renders the four bento cards (HealthScoreCard, BiasDetectorCard, MissingClauseCard, NegotiationPlaybookCard) plus the full clause table, all reading from the analysis response.
3. `History.jsx` — lists past contracts and analyses for the logged-in user.
4. `LegalChat.jsx` — chat interface calling `/chat/ask`, rendering answer plus sources plus the disclaimer.
5. `Analytics.jsx` — charts (using `recharts`) for risk distribution, score trends, anomaly flags — admin-only data scope vs user's own-data scope based on role.
6. `AdminDashboard.jsx` — overview cards plus user management table.

For each page, after building it, manually click through every interaction it supports and confirm the data shown matches what is actually in Postgres for that test account — open `psql` side by side with the browser if needed to cross check.

**Verify (whole phase):** A full end-to-end manual walkthrough — register a new user, log in, upload a real contract, run analysis, view all four feature cards with real data, ask a legal chat question, view it in history, log out, log in as admin, see that user's contract appear in admin analytics.

### Phase 5 Final Checklist

- [ ] Both themes render correctly and visually match the agreed color bases and glassmorphism/bento style
- [ ] Login correctly routes by role and protects routes
- [ ] Upload → analysis → results flow works end to end in the browser
- [ ] All four feature cards display real backend data, not mock/placeholder data
- [ ] Legal chat UI displays sources and the disclaimer on every answer
- [ ] Admin dashboard correctly shows cross-user data; user dashboard correctly shows only own data

---

## PHASE 6 — Analytics and Anomaly Detection

### Step 6.1 — Z-Score Anomaly Service

Create `backend/app/services/anomaly_service.py` computing the mean and standard deviation of `health_score` grouped by `contract_type`, across all of a user's (or, for admin, all users') past analyses, then flagging any new analysis whose z-score exceeds 2.0 in either direction. Require a minimum of 10 historical analyses of that contract type before attempting this calculation — return `None`/insufficient-data otherwise rather than computing a meaningless statistic on too small a sample.

**Verify:** Seed at least 12 fake analyses of the same contract type with varying scores into your test database (a small script under `scripts/` is fine for this), then run a 13th analysis with a deliberately extreme score and confirm it is correctly flagged as anomalous, while a 13th analysis with a typical score is not flagged.

### Step 6.2 — Analytics Endpoints

Create `backend/app/routers/analytics_router.py` exposing aggregate endpoints: risk distribution by contract type, average score trend over time, most frequently flagged missing clauses, most common bias direction. Scope every query by `user_id` for regular users and remove that filter for admin role via the `require_admin` dependency.

**Verify:** Call each endpoint as a regular user and confirm results only include that user's contracts. Call the admin-only endpoint as a regular user and confirm it returns 403. Call it as admin and confirm it aggregates across all users.

### Phase 6 Final Checklist

- [ ] Anomaly detection requires minimum sample size and correctly flags genuine outliers
- [ ] Analytics endpoints are correctly scoped per role
- [ ] Frontend Analytics page correctly renders this data

---

## PHASE 7 — Exports, Audit Trail, Contract Comparison

### Step 7.1 — PDF Report Generation

Create `backend/app/services/report_service.py` using `reportlab` to generate a color-coded PDF: contract metadata, health score with color band, full clause table with risk colors, missing clauses with citations, negotiation playbook, and the disclaimer footer on every page. Use a Unicode-capable font (register a TTF that supports Tamil glyphs, such as Noto Sans Tamil, rather than relying on reportlab's default fonts which do not support Indic scripts).

**Verify:** Generate a PDF for a contract that contains actual Tamil clauses. Open the PDF and confirm Tamil text renders correctly and is not showing as boxes or garbled characters. This is a common silent failure point — check it explicitly, do not assume it works.

### Step 7.2 — CSV/JSON Export

Add simple export endpoints serializing the `clause_results` and summary fields to CSV (via Python's `csv` module) and raw JSON.

**Verify:** Download both formats for a real analysis, open the CSV in a spreadsheet program, confirm Tamil text is not corrupted (this requires UTF-8 BOM encoding for Excel compatibility — verify this specifically).

### Step 7.3 — Contract Comparison

Create a comparison endpoint accepting two contract IDs, running SBERT embeddings on both clause sets, using cosine similarity to match clauses across versions (a clause in version 2 matches its closest counterpart in version 1 if similarity exceeds 0.8), and reporting: clauses unchanged, clauses reworded (matched but text differs), clauses newly added (no match above threshold), clauses removed (version 1 clause with no match in version 2), and the health score delta between versions.

**Verify:** Create two slightly different versions of the same test contract (change 2-3 clauses, add one new clause, remove one). Run the comparison and confirm it correctly identifies each category of change.

### Phase 7 Final Checklist

- [ ] PDF report renders Tamil text correctly
- [ ] CSV export opens correctly in Excel with Tamil text intact
- [ ] Contract comparison correctly distinguishes unchanged/reworded/added/removed clauses on a known test case
- [ ] Every export includes the disclaimer

---

## PHASE 8 — Docker Packaging and Final Deployment

### Step 8.1 — Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-tam \
    tesseract-ocr-eng \
    poppler-utils \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_sm

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Note this installs Tesseract properly as a system package inside the image — exactly the fix for the path-hacking problem from your original project.

### Step 8.2 — Frontend Dockerfile

Create `frontend/Dockerfile` using a multi-stage build: a `node:18` build stage running `npm run build`, then copying the static output into an `nginx:alpine` final stage serving on port 80.

### Step 8.3 — Full System Boot

```bash
cd lexclarity
docker compose up --build
```

**Verify:** Run `docker compose ps` — all four services (`db`, `backend`, `frontend`, plus chromadb if run as a separate service) report running/healthy. Open the frontend URL in a browser. Repeat the full end-to-end manual walkthrough from Phase 5's verification step, this time entirely through the Dockerized stack with no local Python/Node process running outside containers. Every step that worked locally must also work identically inside Docker — if something breaks only in Docker, it is almost always a missing system dependency or an incorrect file path, both of which must be fixed in the Dockerfile, not worked around.

### Step 8.4 — Knowledge Base Ingestion Inside Docker

Run the ingestion scripts from Phase 4A and 4B as one-off commands against the running backend container so the ChromaDB volume is populated in the deployed environment:

```bash
docker compose exec backend python scripts/ingest_knowledge_base.py
docker compose exec backend python scripts/chunk_legal_documents.py
```

**Verify:** Confirm both RAG features (missing clause detection and legal chat) work correctly when tested through the fully Dockerized frontend, not just the local dev environment.

### Phase 8 Final Checklist

- [ ] `docker compose up --build` succeeds with zero manual intervention
- [ ] All services report healthy
- [ ] Full end-to-end walkthrough passes entirely inside Docker
- [ ] Knowledge base ingestion completes successfully inside the container
- [ ] No `.env` secrets are committed to git (final check before any deployment)

---

## Final Project-Wide Sign-Off Checklist

Before considering this project complete, confirm every single item below:

- [ ] Every phase's individual checklist has been completed and verified, not assumed
- [ ] No feature returns fake, default, or hallucinated data when something fails — every failure path shows an explicit error or "could not analyze" state to the user
- [ ] The "not legal advice" disclaimer appears on every analysis view, every export, and every chat answer
- [ ] Tamil text is correctly handled at every layer: extraction, segmentation, LLM analysis, PDF export, CSV export
- [ ] RAG-based answers always include source citations and refuse to answer when retrieval confidence is below threshold
- [ ] Admin and user roles are correctly enforced on every single endpoint, not just the ones you remembered to test
- [ ] All API keys and secrets exist only in `.env`, never committed to git
- [ ] The full system runs end to end inside Docker with one command
- [ ] You have manually tested with at least 3 real, different contracts (not synthetic test strings) covering at least 2 contract types and both English and Tamil
