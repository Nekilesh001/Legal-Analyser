"""
chunk_legal_documents.py — Phase 4B Knowledge Base Ingestion

Extracts text from every PDF under rag_knowledge_base/legal_documents/,
splits on Indian legal section markers without cutting mid-sentence,
attaches metadata (act name, section number, year, category, jurisdiction,
amended flag) to every chunk, then embeds and ingests into the
'legal_knowledge_base' ChromaDB collection.

Run from the project root:
    python scripts/chunk_legal_documents.py

Requirements: pdfplumber, sentence-transformers, chromadb (all in requirements.txt)
"""

import os
import re
import sys
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# ─── Path setup ───────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
KB_PATH = PROJECT_ROOT / "rag_knowledge_base" / "legal_documents"
CHROMA_PATH = PROJECT_ROOT / "backend" / "chroma_db"
COLLECTION_NAME = "legal_knowledge_base"

# ─── Category → metadata mapping ─────────────────────────────────────────────
CATEGORY_META = {
    "employment_acts": {"category": "employment", "jurisdiction": "India"},
    "vendor_acts":     {"category": "vendor",     "jurisdiction": "India"},
    "lease_acts":      {"category": "lease",      "jurisdiction": "India"},
    "ip_acts":         {"category": "ip",          "jurisdiction": "India"},
    "dispute_acts":    {"category": "dispute",    "jurisdiction": "India"},
    "case_law":        {"category": "case_law",   "jurisdiction": "India"},
    "Finance":         {"category": "finance",    "jurisdiction": "India"},
}

# Known acts metadata (keyed on lowercase filename substring matches)
KNOWN_ACTS = [
    {"match": "payment_of_wages",     "act": "Payment of Wages Act",          "year": "1936", "amended": True},
    {"match": "payment_of_gratuity",  "act": "Payment of Gratuity Act",       "year": "1972", "amended": True},
    {"match": "minimum_wages",        "act": "Minimum Wages Act",              "year": "1948", "amended": True},
    {"match": "epfact",               "act": "Employees Provident Fund Act",   "year": "1952", "amended": True},
    {"match": "maternity_benefit",    "act": "Maternity Benefit Act",          "year": "1961", "amended": True},
    {"match": "shops_and_establishments", "act": "Tamil Nadu Shops and Establishments Act", "year": "1947", "amended": True, "jurisdiction": "Tamil Nadu"},
    {"match": "regn_manual",          "act": "Tamil Nadu Registration Manual", "year": "2007", "amended": False, "jurisdiction": "Tamil Nadu"},
    {"match": "satyam",               "act": "Satyam Case Judgment",           "year": "2009", "amended": False, "category": "case_law"},
    {"match": "6113_2023",            "act": "Supreme Court Judgment",         "year": "2025", "amended": False, "category": "case_law"},
]

# ─── Section splitter patterns ────────────────────────────────────────────────
SECTION_PATTERNS = [
    # Standard Indian statute pattern: "Section 25F." or "25F."
    re.compile(r'(?=\bSection\s+\d+[A-Z]*\.)', re.IGNORECASE),
    # Numbered subsection: "1. " at the start of a line (standalone)
    re.compile(r'(?=^\d{1,3}\.\s+[A-Z])', re.MULTILINE),
    # "SECTION XX" (all caps)
    re.compile(r'(?=\bSECTION\s+\d+)', re.IGNORECASE),
    # Clause markers
    re.compile(r'(?=\bClause\s+\d+)', re.IGNORECASE),
    # Article markers
    re.compile(r'(?=\bArticle\s+\d+)', re.IGNORECASE),
]

MIN_CHUNK_CHARS = 80    # Ignore fragments shorter than this
MAX_CHUNK_CHARS = 2000  # Split very long chunks at sentence boundaries


def _extract_act_meta(filepath: Path, category: str) -> dict:
    """Determine act name, year, jurisdiction, amended from filename."""
    fname = filepath.name.lower()
    base_meta = {
        "act": filepath.stem.replace("_", " ").replace("-", " ").title(),
        "year": "unknown",
        "jurisdiction": "India",
        "category": category,
        "amended": False,
        "source_file": filepath.name,
    }
    for known in KNOWN_ACTS:
        if known["match"] in fname:
            base_meta.update({k: v for k, v in known.items() if k != "match"})
            break
    return base_meta


def _extract_section_number(chunk_text: str) -> str:
    """Try to extract a section number from the chunk's first line."""
    m = re.search(r'\bSection\s+(\d+[A-Z]*)', chunk_text[:200], re.IGNORECASE)
    if m:
        return m.group(1)
    m = re.search(r'^\s*(\d+[A-Z]?)\.\s', chunk_text[:100], re.MULTILINE)
    if m:
        return m.group(1)
    return "unknown"


def _split_text_into_chunks(text: str) -> list[str]:
    """
    Split text on Indian legal section markers without cutting mid-sentence.
    Falls back to paragraph-based splitting if no markers found.
    """
    # Try each section pattern; use the one that produces the most splits
    best_chunks = [text]
    for pattern in SECTION_PATTERNS:
        parts = [p.strip() for p in pattern.split(text) if p.strip()]
        if len(parts) > len(best_chunks):
            best_chunks = parts

    # If still just one blob, split on double-newlines (paragraphs)
    if len(best_chunks) <= 1:
        best_chunks = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]

    # Filter minimum length and split oversized chunks
    final_chunks = []
    for chunk in best_chunks:
        if len(chunk) < MIN_CHUNK_CHARS:
            continue
        if len(chunk) <= MAX_CHUNK_CHARS:
            final_chunks.append(chunk)
        else:
            # Split oversized chunk at sentence boundaries
            sentences = re.split(r'(?<=[.!?])\s+', chunk)
            current = ""
            for sent in sentences:
                if len(current) + len(sent) + 1 <= MAX_CHUNK_CHARS:
                    current = (current + " " + sent).strip() if current else sent
                else:
                    if len(current) >= MIN_CHUNK_CHARS:
                        final_chunks.append(current)
                    current = sent
            if current and len(current) >= MIN_CHUNK_CHARS:
                final_chunks.append(current)

    return final_chunks


def _extract_pdf_text(pdf_path: Path) -> str:
    """Extract text from PDF using pdfplumber, fall back to pytesseract if needed."""
    try:
        import pdfplumber
        full_text = ""
        with pdfplumber.open(str(pdf_path)) as pdf:
            num_pages = len(pdf.pages)
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                full_text += page_text + "\n"
        avg_chars = len(full_text) / max(num_pages, 1)
        if avg_chars < 50 and num_pages > 0:
            # Scanned PDF — try OCR
            logger.info(f"  Low text density ({avg_chars:.0f} chars/page), attempting OCR for {pdf_path.name}")
            full_text = _ocr_pdf(pdf_path) or full_text
        return full_text
    except Exception as e:
        logger.warning(f"  pdfplumber failed for {pdf_path.name}: {e}")
        return ""


def _ocr_pdf(pdf_path: Path) -> str:
    """OCR fallback using pytesseract via pdf2image."""
    try:
        from pdf2image import convert_from_path
        import pytesseract
        images = convert_from_path(str(pdf_path), dpi=200)
        texts = []
        for img in images:
            texts.append(pytesseract.image_to_string(img, lang="eng+tam"))
        return "\n".join(texts)
    except Exception as e:
        logger.warning(f"  OCR also failed: {e}")
        return ""


def ingest():
    """Main ingestion function."""
    try:
        from sentence_transformers import SentenceTransformer
        import chromadb
    except ImportError as e:
        logger.error(f"Missing dependency: {e}. Run: pip install sentence-transformers chromadb")
        sys.exit(1)

    logger.info(f"Loading SBERT model (paraphrase-multilingual-MiniLM-L12-v2)...")
    model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

    logger.info(f"Connecting to ChromaDB at {CHROMA_PATH}...")
    os.makedirs(CHROMA_PATH, exist_ok=True)
    client = chromadb.PersistentClient(path=str(CHROMA_PATH))

    # Delete existing collection to avoid stale data, then recreate
    try:
        client.delete_collection(COLLECTION_NAME)
        logger.info(f"Deleted existing '{COLLECTION_NAME}' collection for fresh ingest.")
    except Exception:
        pass
    collection = client.create_collection(COLLECTION_NAME, metadata={"hnsw:space": "cosine"})

    if not KB_PATH.exists():
        logger.error(f"Knowledge base path not found: {KB_PATH}")
        sys.exit(1)

    total_chunks = 0
    total_pdfs = 0
    skipped_pdfs = 0

    for category_dir in KB_PATH.iterdir():
        if not category_dir.is_dir():
            continue
        cat_name = category_dir.name
        cat_meta = CATEGORY_META.get(cat_name, {"category": cat_name, "jurisdiction": "India"})

        pdf_files = list(category_dir.glob("*.pdf"))
        if not pdf_files:
            logger.info(f"  No PDFs in {cat_name}/")
            continue

        logger.info(f"\nProcessing {cat_name}/ ({len(pdf_files)} PDFs)...")

        for pdf_path in pdf_files:
            logger.info(f"  Extracting: {pdf_path.name}")
            text = _extract_pdf_text(pdf_path)

            if not text.strip():
                logger.warning(f"  ⚠️  No text extracted from {pdf_path.name} — skipping")
                skipped_pdfs += 1
                continue

            act_meta = _extract_act_meta(pdf_path, cat_meta.get("category", cat_name))
            act_meta["jurisdiction"] = act_meta.get("jurisdiction", cat_meta.get("jurisdiction", "India"))

            chunks = _split_text_into_chunks(text)
            logger.info(f"    → {len(chunks)} chunks from {len(text):,} chars")

            if not chunks:
                logger.warning(f"    No valid chunks from {pdf_path.name}")
                skipped_pdfs += 1
                continue

            # Batch embed (faster than one-by-one)
            embeddings = model.encode(chunks, convert_to_numpy=True, show_progress_bar=False)

            ids = []
            embeds = []
            docs = []
            metas = []

            for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
                section_num = _extract_section_number(chunk)
                chunk_id = f"{cat_name}__{pdf_path.stem}__{i}"
                ids.append(chunk_id)
                embeds.append(emb.tolist())
                docs.append(chunk)
                metas.append({
                    "act": act_meta.get("act", "Unknown Act"),
                    "section": section_num,
                    "year": str(act_meta.get("year", "unknown")),
                    "category": act_meta.get("category", cat_name),
                    "jurisdiction": act_meta.get("jurisdiction", "India"),
                    "amended": str(act_meta.get("amended", False)),
                    "source_file": act_meta.get("source_file", pdf_path.name),
                    "title": f"{act_meta.get('act', 'Unknown')} — Section {section_num}",
                })

            # Upsert in batches of 100
            BATCH_SIZE = 100
            for b in range(0, len(ids), BATCH_SIZE):
                collection.add(
                    ids=ids[b:b+BATCH_SIZE],
                    embeddings=embeds[b:b+BATCH_SIZE],
                    documents=docs[b:b+BATCH_SIZE],
                    metadatas=metas[b:b+BATCH_SIZE],
                )

            total_chunks += len(chunks)
            total_pdfs += 1

    logger.info(f"\n{'='*60}")
    logger.info(f"✅ Ingestion complete!")
    logger.info(f"   PDFs processed: {total_pdfs}")
    logger.info(f"   PDFs skipped:   {skipped_pdfs}")
    logger.info(f"   Total chunks:   {total_chunks}")
    logger.info(f"   Collection:     {COLLECTION_NAME}")
    logger.info(f"   ChromaDB path:  {CHROMA_PATH}")

    # Quick sanity query
    logger.info(f"\nRunning sanity query: 'notice period for employee termination'")
    try:
        q_emb = model.encode("what is the notice period required for employee termination").tolist()
        results = collection.query(query_embeddings=[q_emb], n_results=3)
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0]
        ):
            similarity = 1 - dist
            logger.info(f"  [{similarity:.3f}] {meta.get('act')} § {meta.get('section')} — {doc[:120]}...")
    except Exception as e:
        logger.warning(f"Sanity query failed: {e}")

    return total_chunks


if __name__ == "__main__":
    count = ingest()
    if count == 0:
        logger.error("Zero chunks ingested — check your PDF files.")
        sys.exit(1)
