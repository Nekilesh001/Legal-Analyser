# TODO: deferred to v2 — not wired into the analysis pipeline.
# A real implementation would run Indian-law-specific compliance checks
# (POSH Act, EPF Act, Minimum Wages Act, etc.) against extracted clause text
# using rule-based pattern matching or a fine-tuned classifier.
#
# IMPORTANT: Do NOT call this function expecting real output. It returns a
# hardcoded stub response and is intentionally excluded from the analysis
# orchestration in analysis_router.py.
def check_compliance(clauses: list[str]) -> dict:
    """
    STUB — v2 placeholder. Returns hardcoded 'Compliant'.
    Do not use in production without implementing real rule-based logic.
    """
    return {"status": "Compliant", "issues": [], "_stub": True}
