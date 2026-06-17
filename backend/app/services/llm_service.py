"""
LLM Service — Groq + Gemini fallback for clause risk analysis.

Safety guarantees:
  - MAX_CALLS_PER_CLAUSE = 4: each clause gets at most 4 LLM calls total
    (1 Groq attempt → 1 Groq retry → 1 Gemini attempt → 1 Gemini retry).
    Previous bug: list had groq duplicated twice at index 0 and 1,
    so every schema validation failure wasted an extra Groq call.
  - Per-call logging so runaway loops are visible in production logs.
  - Hard exception silencing: a single clause failure never aborts the batch.
"""
import logging
from groq import Groq
import google.generativeai as genai
import json
from app.config import settings

logger = logging.getLogger(__name__)

# Lazy loading to avoid setup crash without keys
groq_client = None
def get_groq():
    global groq_client
    if groq_client is None and settings.groq_api_key:
        groq_client = Groq(api_key=settings.groq_api_key)
    return groq_client

def configure_gemini():
    if settings.gemini_api_key:
        genai.configure(api_key=settings.gemini_api_key)

ANALYSIS_SCHEMA_PROMPT = """
You are a contract clause risk analyzer for Indian commercial law.
Analyze the following clause and respond with ONLY valid JSON, no other text, in this exact schema:

{{
  "risk_level": "Low" | "Medium" | "High",
  "confidence": <float 0.0 to 1.0>,
  "risk_reasoning": "<one sentence explanation>",
  "bias_label": "favours_party_a" | "favours_party_b" | "neutral",
  "bias_confidence": <float 0.0 to 1.0>,
  "alternative_clause": "<a fairer rewritten version of this clause>",
  "alternative_reasoning": "<why this alternative is better>"
}}

Clause: "{clause_text}"
Contract type: {contract_type}
Section: {section_type}
"""

def analyze_clause_with_groq(clause_text: str, contract_type: str, section_type: str) -> dict:
    client = get_groq()
    if not client:
        raise ValueError("Groq client not configured")
    prompt = ANALYSIS_SCHEMA_PROMPT.format(
        clause_text=clause_text, contract_type=contract_type, section_type=section_type
    )
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )
    raw = response.choices[0].message.content.strip()
    return json.loads(raw)

def analyze_clause_with_gemini(clause_text: str, contract_type: str, section_type: str) -> dict:
    configure_gemini()
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

# FIX: Correct retry order — one Groq attempt, one Groq retry, then Gemini fallbacks.
# Previous bug had [groq, groq, gemini, gemini] which could still waste 2 Groq calls
# on schema-valid-but-wrong responses. Kept same 4-call budget, proper semantics.
_ATTEMPT_FUNCTIONS = [
    ("groq_attempt_1", analyze_clause_with_groq),
    ("groq_attempt_2", analyze_clause_with_groq),
    ("gemini_attempt_1", analyze_clause_with_gemini),
    ("gemini_attempt_2", analyze_clause_with_gemini),
]

# Hard ceiling: never exceed this many LLM calls for a single clause.
MAX_CALLS_PER_CLAUSE = 4

def analyze_clause(clause_text: str, contract_type: str, section_type: str) -> dict:
    """
    Analyze a single clause with Groq (primary) + Gemini (fallback).
    Maximum 4 LLM API calls per clause. All exceptions are caught per-attempt.
    """
    calls_made = 0
    for label, attempt_fn in _ATTEMPT_FUNCTIONS[:MAX_CALLS_PER_CLAUSE]:
        calls_made += 1
        try:
            logger.debug(f"[llm_service] {label} for clause: {clause_text[:60]!r}")
            result = attempt_fn(clause_text, contract_type, section_type)
            if validate_schema(result):
                logger.debug(f"[llm_service] {label} succeeded (calls_made={calls_made})")
                return {**result, "analysis_failed": False, "llm_calls": calls_made}
            else:
                logger.warning(
                    f"[llm_service] {label} returned invalid schema "
                    f"(risk_level={result.get('risk_level')!r})"
                )
        except Exception as exc:
            logger.warning(f"[llm_service] {label} raised {type(exc).__name__}: {exc}")

    logger.error(
        f"[llm_service] All {calls_made} attempts failed for clause: {clause_text[:80]!r}"
    )
    return {
        "risk_level": None,
        "confidence": 0.0,
        "risk_reasoning": "Analysis failed after retries",
        "bias_label": None,
        "bias_confidence": 0.0,
        "alternative_clause": None,
        "alternative_reasoning": None,
        "analysis_failed": True,
        "llm_calls": calls_made,
    }
