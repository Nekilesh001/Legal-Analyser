def compute_health_score(clause_results: list[dict]) -> dict:
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
