"""
test_scoring.py — Real unit tests for compute_health_score

Tests:
1. All-Low set → health_score near 100
2. All-High set at 100% confidence → health_score near 0
3. Mixed set → correct weighted math
4. Empty input → returns None score, not crash
5. All-failed set → returns None, failed_count matches
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from app.services.scoring_service import compute_health_score


def _make_result(risk_level, confidence, failed=False):
    return {
        "risk_level": risk_level,
        "confidence": confidence,
        "analysis_failed": failed,
    }


class TestComputeHealthScore:

    def test_all_low_risk_score_near_100(self):
        """All low-risk clauses at full confidence → health score must be 100."""
        results = [_make_result("Low", 1.0) for _ in range(10)]
        out = compute_health_score(results)
        assert out["health_score"] == 100.0, f"Expected 100.0, got {out['health_score']}"
        assert out["low_count"] == 10
        assert out["high_count"] == 0
        assert out["medium_count"] == 0

    def test_all_high_risk_100pct_confidence_score_near_0(self):
        """All high-risk clauses at 100% confidence → health score must be 0."""
        results = [_make_result("High", 1.0) for _ in range(8)]
        out = compute_health_score(results)
        assert out["health_score"] == 0.0, f"Expected 0.0, got {out['health_score']}"
        assert out["high_count"] == 8

    def test_mixed_set_math(self):
        """
        5 High at 1.0 confidence + 5 Low at 1.0 confidence.
        weight_map: High=3, Low=0.
        total_weighted = 5*3*1.0 + 5*0*1.0 = 15
        max_possible = 3 * 10 = 30
        risk_ratio = 15/30 = 0.5
        health_score = 100 - 50 = 50.0
        """
        results = (
            [_make_result("High", 1.0) for _ in range(5)] +
            [_make_result("Low", 1.0) for _ in range(5)]
        )
        out = compute_health_score(results)
        assert out["health_score"] == 50.0, f"Expected 50.0, got {out['health_score']}"
        assert out["high_count"] == 5
        assert out["low_count"] == 5

    def test_medium_risk_partial_confidence(self):
        """
        4 Medium at 0.5 confidence.
        total_weighted = 4 * 1 * 0.5 = 2
        max_possible = 4 * 3 = 12
        risk_ratio = 2/12 ≈ 0.1667
        health_score ≈ 83.3
        """
        results = [_make_result("Medium", 0.5) for _ in range(4)]
        out = compute_health_score(results)
        assert abs(out["health_score"] - 83.3) < 0.5, f"Expected ~83.3, got {out['health_score']}"

    def test_empty_input_returns_none_score(self):
        """Empty list → health_score is None, not crash, not 0."""
        out = compute_health_score([])
        assert out["health_score"] is None
        assert out["high_count"] == 0

    def test_all_failed_clauses_returns_none_score(self):
        """All analysis_failed=True → no valid results → health_score is None."""
        results = [_make_result("High", 1.0, failed=True) for _ in range(5)]
        out = compute_health_score(results)
        assert out["health_score"] is None
        # When all are failed, valid_results is empty so counts are all 0
        assert out["high_count"] == 0
        assert out["low_count"] == 0

    def test_mixed_valid_and_failed(self):
        """3 valid Low + 2 failed → score based only on the 3 valid ones = 100."""
        results = (
            [_make_result("Low", 1.0) for _ in range(3)] +
            [_make_result("High", 1.0, failed=True) for _ in range(2)]
        )
        out = compute_health_score(results)
        assert out["health_score"] == 100.0
        assert out.get("failed_count") == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
