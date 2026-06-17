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
