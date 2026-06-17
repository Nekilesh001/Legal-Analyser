<<<<<<< HEAD
# Legal Contract Analyzer

A powerful, modern React-based application designed to streamline legal document review. This tool analyzes contract text, identifies potential risks, detects critical clauses, and provides actionable recommendations based on a built-in legal knowledge base.


## ✨ Key Features

- **Automated Contract Analysis**: Quickly analyze the content of any legal agreement.
- **Risk Assessment**: Get an overall risk score and detailed breakdowns of high, medium, and low-risk terms.
- **Clause Detection**: Automatically identify standard clauses such as Termination, Confidentiality, Liability, Payment, Intellectual Property, and Dispute Resolution.
- **Knowledge Base Integration**: Leverages a structured legal knowledge base to provide deeper insights into specific contract types.
- **Interactive Dashboard**: Visualize your analysis statistics and recent activity at a glance.
- **History & Reports**: Keep track of previous analyses and generate detailed reports.
- **Multi-language Support**: Designed with internationalization in mind.
- **Modern UI/UX**: Built with Tailwind CSS and Framer Motion for a fluid, premium experience.

## 🚀 Tech Stack

- **Frontend**: React 18, React Router 6
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Local Storage**: Dexie.js (IndexedDB wrapper for storing history)
- **Internationalization**: i18next

## 🛠️ Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Legal-Contract-Analyzer
   ```

2. **Navigate to the application folder**:
   ```bash
   cd react-legal-analyzer
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

The application should now be running at `http://localhost:3000`.

## 📂 Project Structure

- `src/components/`: UI components and page layouts (Dashboard, Analyzer, Results, etc.).
- `src/services/`: Core logic for legal analysis and knowledge base interactions.
- `src/contexts/`: React Contexts for state management (Analysis, Settings).
- `src/i18n/`: Internationalization configuration.

## ⚖️ License

This project is licensed under the MIT License - see the LICENSE file for details.

=======
# LexClarity

**An Indian Legal Contract Intelligence Platform** — analyzes contracts for risk, bias, missing mandatory clauses, and generates negotiation strategies, grounded in Indian law via RAG. Includes a legal knowledge chatbot and a contract-specific contextual assistant.

> ⚠️ **Development status**: This project is under active development. Authentication is currently disabled in favor of a dev-mode role-picker (see [Authentication](#authentication) below) — **do not deploy this build publicly as-is.**

---

## What This Does

Upload an employment, vendor, lease, NDA, or SLA contract (PDF, DOCX, or TXT — English or Tamil) and get back:

- A **contract health score** (0–100) computed from weighted per-clause risk analysis
- A **party bias breakdown** — who the contract favours and by how much
- **Missing clause detection** — mandatory Indian-law clauses absent from the contract, with exact Act/Section citations, grounded via RAG against a curated legal knowledge base
- A **negotiation playbook** — must-fix / should-negotiate / accept-as-is categorization with counter-clause language
- A **general Legal Chat assistant** — ask free-form questions about Indian law, answered only from ingested Act texts, with citations and an explicit refusal when the knowledge base doesn't cover the question
- A **contract-specific chat assistant** — ask follow-up questions about a specific analyzed contract, blending that contract's own analysis with relevant law citations

Every output includes confidence scores and an explicit "not legal advice" disclaimer. The system is designed to refuse and say "I don't know" rather than fabricate an answer.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python 3.11) |
| Frontend | React + Tailwind, bento-grid glassmorphism UI |
| Database | PostgreSQL |
| Vector store | ChromaDB |
| Primary LLM | Groq (Llama 3.1 70B) |
| Fallback LLM | Gemini 1.5 Pro |
| NLP | spaCy, indicnlp (Tamil), lingua (language detection) |
| Embeddings | SBERT (`paraphrase-multilingual-MiniLM-L12-v2`) |
| OCR | Tesseract (eng+tam) with Gemini Vision fallback on low confidence |
| Containerization | Docker + docker-compose |

See [`LexClarity_Build_Plan.md`](./LexClarity_Build_Plan.md) for the full phase-by-phase architecture and build rationale.

---

## Project Structure

```
lexclarity/
├── backend/                  # FastAPI app, services, models, routers
├── frontend/                 # React app (admin + user dual theme)
├── rag_knowledge_base/
│   ├── contract_rules/       # Hand-authored mandatory clauses + negotiation playbooks (tracked in git)
│   └── legal_documents/      # Source Act/case-law PDFs (NOT tracked in git — see Setup)
├── scripts/                  # Ingestion, chunking, and seeding scripts
└── docker-compose.yml
```

---

## Setup

### 1. Clone and configure environment

```bash
git clone https://github.com/Nekilesh001/Legal-Analyser.git
cd Legal-Analyser
git checkout dev
cp .env.example .env
```

Edit `.env` and fill in:

```
DATABASE_URL=postgresql://lexuser:lexpassword@db:5432/lexclarity_db
JWT_SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
GROQ_API_KEY=<your Groq key>
GEMINI_API_KEY=<your Gemini key>
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000
```

### 2. Legal knowledge base PDFs (not included in this repo)

`rag_knowledge_base/legal_documents/` is excluded from version control — Act PDFs are large binary files that don't belong in git. You need to populate this folder yourself before running ingestion:

1. Source official Act PDFs from [indiacode.nic.in](https://www.indiacode.nic.in) and [legislative.gov.in](https://legislative.gov.in). Verify each one manually — confirm it's the current, amended version before downloading.
2. Use `scripts/organize_legal_docs.py` with a manually curated `acts_to_download.csv` (`act_name,category,source_url`) to download, validate, and sort PDFs into the correct subfolders. Do not use unverified bulk scrapers — see the script's docstring for why.
3. Folders expected: `employment_acts/`, `vendor_acts/`, `lease_acts/`, `ip_acts/`, `dispute_acts/`, `case_law/`.

### 3. Start the stack

```bash
docker compose up --build
```

### 4. Ingest the knowledge bases (one-time, after PDFs are in place)

```bash
docker compose exec backend python scripts/ingest_knowledge_base.py
docker compose exec backend python scripts/chunk_legal_documents.py
```

The first populates `contract_analysis_rag` (mandatory clauses + negotiation playbooks, already authored and tracked in this repo). The second populates `legal_knowledge_base` from the Act PDFs you sourced in step 2 — this step has no output until those PDFs exist.

### 5. Open the app

Frontend: `http://localhost:5174` (or whichever port Vite assigns — check your terminal output)
Backend API docs: `http://localhost:8000/docs`

---

## Authentication

**Password-based login is currently disabled.** The app opens directly to a role-picker screen (`/select-role`) where you choose "Continue as User" or "Continue as Admin." This issues a real JWT against fixed seed accounts (`dev_user` / `dev_admin`) — the underlying authorization model (roles, ownership checks, admin-only endpoints) is fully intact and enforced, only the login screen itself is bypassed.

This is a deliberate simplification for local development and is clearly labeled as such on the role-picker screen. Re-enabling real authentication is a routing change (restoring the login page and removing the role-picker), not a rebuild — `auth_router.py` and the JWT/password logic remain in place, unused, for this purpose.

---

## Known Limitations / In Progress

- `compliance_service.py` is an explicit v2 stub, not wired into the analysis pipeline.
- A small percentage of ingested legal document chunks have unresolved section metadata (`section: unknown`) where the chunking regex didn't match that document's formatting — affects citation specificity for a few source PDFs, not retrieval correctness.
- Full Docker end-to-end verification is ongoing as features are added — see commit history for the latest verified state.
- This is an analysis and information tool, not a substitute for legal advice. Every output carries this disclaimer for a reason — please take it seriously.

---

## Disclaimer

LexClarity provides automated legal information and analysis only. It does not constitute legal advice. Always consult a qualified lawyer before making decisions based on its output.
>>>>>>> dev
