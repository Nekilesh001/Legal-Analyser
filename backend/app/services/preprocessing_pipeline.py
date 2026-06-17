"""
Preprocessing Pipeline — Full NLP orchestration.
Phase 2: extraction → language detection → segmentation → entity extraction
         → section classification → SBERT deduplication.

Returns clean list of unique clause objects.

Safety limits (prevent runaway LLM cost):
  MAX_CLAUSES_PER_CONTRACT: hard cap on LLM-analyzed clauses.
  MIN_CLAUSE_CHARS: minimum text length to be considered a real clause.
  DEDUP_THRESHOLD: lowered to 0.85 so near-paraphrase variants are merged.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Safety limits — protect against API cost blowout on large or annexure-heavy contracts
MAX_CLAUSES_PER_CONTRACT = 80   # Hard ceiling: no contract gets more than 80 LLM calls
MIN_CLAUSE_CHARS = 40           # Skip header lines, numbering, short snippets
DEDUP_THRESHOLD = 0.85          # 0.92 was too strict — near-paraphrase variants slipped through


def run_preprocessing_pipeline(
    raw_text: str,
    contract_type: str = "other"
) -> list[dict]:
    """
    Full preprocessing pipeline.

    Args:
        raw_text: Raw extracted text from a contract document.
        contract_type: Type of contract (used for context).

    Returns:
        List of clause dicts, each containing:
        {
            "text": str,
            "language": str,
            "section_type": str,
            "entities": dict,
            "duplicate_count": int,  # how many dupes this represents
            "is_representative": True
        }
    """
    from app.services.language_service import detect_clause_language
    from app.services.segmentation_service import segment_by_language, extract_entities
    from app.services.dedup_service import deduplicate_clauses

    # Lazy import section classifier (may need to train on first run)
    try:
        from app.services.section_classifier import classify_section
        has_classifier = True
    except Exception as e:
        logger.warning(f"Section classifier unavailable: {e}")
        has_classifier = False

    if not raw_text or not raw_text.strip():
        return []

    # Step 1: Split into paragraphs for language detection
    paragraphs = [p.strip() for p in raw_text.split("\n\n") if len(p.strip()) > 30]
    if not paragraphs:
        paragraphs = [raw_text]

    # Step 2: Detect dominant language (from first few paragraphs)
    sample = " ".join(paragraphs[:5])
    dominant_language = detect_clause_language(sample)
    logger.info(f"Detected dominant language: {dominant_language}")

    # Step 3: Segment by language, applying MIN_CLAUSE_CHARS filter immediately
    clauses_raw = []
    for para in paragraphs:
        lang = detect_clause_language(para) if len(para) > 50 else dominant_language
        segments = segment_by_language(para, lang)
        for seg in segments:
            # Skip header lines, clause numbers, short snippets — not real clauses
            if len(seg) >= MIN_CLAUSE_CHARS:
                clauses_raw.append({"text": seg, "language": lang})

    logger.info(f"Pre-dedup raw clause count: {len(clauses_raw)} (after MIN_CLAUSE_CHARS={MIN_CLAUSE_CHARS} filter)")

    if not clauses_raw:
        return []

    # Step 4: Deduplicate with lowered threshold to catch near-paraphrase variants
    texts = [c["text"] for c in clauses_raw]
    dedup_result = deduplicate_clauses(texts, similarity_threshold=DEDUP_THRESHOLD)
    unique_indices = dedup_result["unique_indices"]
    duplicate_map = dedup_result["duplicate_map"]
    logger.info(f"Post-dedup unique clause count: {len(unique_indices)} (threshold={DEDUP_THRESHOLD})")

    # Build duplicate counts: how many times each unique index appears
    duplicate_count_map: dict[int, int] = {i: 1 for i in unique_indices}
    for dup_idx, rep_idx in duplicate_map.items():
        if rep_idx in duplicate_count_map:
            duplicate_count_map[rep_idx] += 1

    # Step 5: Enrich unique clauses with entities + section classification
    result = []
    for idx in unique_indices:
        clause_text = clauses_raw[idx]["text"]
        clause_lang = clauses_raw[idx]["language"]

        entities = extract_entities(clause_text)

        if has_classifier:
            try:
                section_type = classify_section(clause_text)
            except Exception:
                section_type = "other"
        else:
            section_type = "other"

        import hashlib
        clause_id = hashlib.sha256(clause_text.encode('utf-8')).hexdigest()[:12]

        result.append({
            "clause_id": clause_id,
            "text": clause_text,
            "language": clause_lang,
            "section_type": section_type,
            "entities": entities,
            "duplicate_count": duplicate_count_map.get(idx, 1),
            "is_representative": True
        })

    # Step 6: Hard cap — if still over limit, take highest-scoring section_types first
    if len(result) > MAX_CLAUSES_PER_CONTRACT:
        # Priority order: substantive > procedural > boilerplate section types
        PRIORITY = {
            "termination": 0, "liability": 1, "payment": 2, "confidentiality": 3,
            "ip": 4, "dispute_resolution": 5, "indemnity": 6, "non_compete": 7,
            "other": 8, "recital": 9, "definition": 10,
        }
        result.sort(key=lambda c: PRIORITY.get(c.get("section_type", "other"), 8))
        dropped = len(result) - MAX_CLAUSES_PER_CONTRACT
        result = result[:MAX_CLAUSES_PER_CONTRACT]
        logger.warning(
            f"[preprocessing] Hard cap applied: dropped {dropped} clauses to stay within "
            f"MAX_CLAUSES_PER_CONTRACT={MAX_CLAUSES_PER_CONTRACT}. "
            f"Contract may have very large annexures."
        )

    logger.info(
        f"Pipeline complete: {len(clauses_raw)} raw clauses → "
        f"{len(result)} unique clauses (removed {len(clauses_raw) - len(result)} duplicates/excess)"
    )
    return result
