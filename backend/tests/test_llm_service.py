"""
test_llm_service.py — Real unit tests for LLM service

Tests:
1. validate_schema rejects malformed/missing-key JSON
2. validate_schema rejects invalid enum values  
3. validate_schema accepts a correct schema
4. analyze_clause returns analysis_failed=True when both providers are mocked to fail
5. analyze_clause falls back correctly to Gemini when Groq fails
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from unittest.mock import patch, MagicMock


def _load_validate_schema():
    """Load validate_schema with mocked imports for groq/google.generativeai."""
    groq_mock = MagicMock()
    genai_mock = MagicMock()
    with patch.dict("sys.modules", {"groq": groq_mock, "google.generativeai": genai_mock}):
        # Force reimport to pick up mocks
        if "app.services.llm_service" in sys.modules:
            del sys.modules["app.services.llm_service"]
        from app.services.llm_service import validate_schema
        return validate_schema


def _load_analyze_clause():
    """Load analyze_clause with mocked imports."""
    groq_mock = MagicMock()
    genai_mock = MagicMock()
    with patch.dict("sys.modules", {"groq": groq_mock, "google.generativeai": genai_mock}):
        if "app.services.llm_service" in sys.modules:
            del sys.modules["app.services.llm_service"]
        import app.services.llm_service as llm_mod
        return llm_mod


class TestValidateSchema:
    """Tests for validate_schema in llm_service."""

    def test_rejects_missing_required_key(self):
        """Missing 'risk_level' must return False."""
        validate = _load_validate_schema()
        bad = {
            "confidence": 0.8,
            "risk_reasoning": "Some reasoning",
            "bias_label": "neutral",
            "bias_confidence": 0.7,
            "alternative_clause": "Better wording",
            "alternative_reasoning": "Why it's better",
            # risk_level missing
        }
        assert validate(bad) is False

    def test_rejects_invalid_risk_level(self):
        """risk_level='Critical' is not a valid value."""
        validate = _load_validate_schema()
        bad = {
            "risk_level": "Critical",  # invalid
            "confidence": 0.8,
            "risk_reasoning": "Some",
            "bias_label": "neutral",
            "bias_confidence": 0.5,
            "alternative_clause": "Better",
            "alternative_reasoning": "Why",
        }
        assert validate(bad) is False

    def test_rejects_invalid_bias_label(self):
        """bias_label='buyer' (not 'favours_party_a') is invalid."""
        validate = _load_validate_schema()
        bad = {
            "risk_level": "Low",
            "confidence": 0.9,
            "risk_reasoning": "Fine",
            "bias_label": "buyer",  # invalid
            "bias_confidence": 0.6,
            "alternative_clause": "OK",
            "alternative_reasoning": "OK",
        }
        assert validate(bad) is False

    def test_rejects_out_of_range_confidence(self):
        """confidence=1.5 is out of [0.0, 1.0] range."""
        validate = _load_validate_schema()
        bad = {
            "risk_level": "Low",
            "confidence": 1.5,  # out of range
            "risk_reasoning": "Fine",
            "bias_label": "neutral",
            "bias_confidence": 0.5,
            "alternative_clause": "OK",
            "alternative_reasoning": "OK",
        }
        assert validate(bad) is False

    def test_accepts_valid_full_schema(self):
        """A fully valid response must return True."""
        validate = _load_validate_schema()
        good = {
            "risk_level": "High",
            "confidence": 0.92,
            "risk_reasoning": "This clause limits employer liability excessively.",
            "bias_label": "favours_party_a",
            "bias_confidence": 0.85,
            "alternative_clause": "Either party may terminate with 30 days notice.",
            "alternative_reasoning": "Balanced termination clause.",
        }
        assert validate(good) is True

    def test_accepts_medium_risk_vendor(self):
        """Medium risk, favours_party_b is valid."""
        validate = _load_validate_schema()
        good = {
            "risk_level": "Medium",
            "confidence": 0.7,
            "risk_reasoning": "Payment terms skewed toward vendor.",
            "bias_label": "favours_party_b",
            "bias_confidence": 0.65,
            "alternative_clause": "Payment within 30 days of invoice receipt.",
            "alternative_reasoning": "Standard industry payment terms.",
        }
        assert validate(good) is True


class TestAnalyzeClauseFailure:
    """Test that analyze_clause returns the explicit failure object on total failure."""

    def test_returns_analysis_failed_true_when_both_providers_fail(self):
        """When Groq raises and Gemini raises, result must have analysis_failed=True."""
        groq_mock = MagicMock()
        genai_mock = MagicMock()
        with patch.dict("sys.modules", {"groq": groq_mock, "google.generativeai": genai_mock}):
            if "app.services.llm_service" in sys.modules:
                del sys.modules["app.services.llm_service"]
            import app.services.llm_service as llm_mod

            # Patch the actual functions in the module
            llm_mod.analyze_clause_with_groq = MagicMock(side_effect=Exception("Groq down"))
            llm_mod.analyze_clause_with_gemini = MagicMock(side_effect=Exception("Gemini down"))

            result = llm_mod.analyze_clause(
                "The employee shall work 12 hours per day.", "employment", "other"
            )

        assert result["analysis_failed"] is True
        assert result["risk_level"] is None
        assert result["confidence"] == 0.0
        assert result["bias_label"] is None
        assert "failed" in result["risk_reasoning"].lower()

    def test_returns_analysis_failed_on_invalid_json(self):
        """When both providers return invalid JSON, must flag as failed."""
        import json
        groq_mock = MagicMock()
        genai_mock = MagicMock()
        with patch.dict("sys.modules", {"groq": groq_mock, "google.generativeai": genai_mock}):
            if "app.services.llm_service" in sys.modules:
                del sys.modules["app.services.llm_service"]
            import app.services.llm_service as llm_mod

            def bad_parse(*args, **kwargs):
                raise json.JSONDecodeError("No JSON", "", 0)

            llm_mod.analyze_clause_with_groq = MagicMock(side_effect=bad_parse)
            llm_mod.analyze_clause_with_gemini = MagicMock(side_effect=Exception("Gemini down"))

            result = llm_mod.analyze_clause("Some clause.", "vendor", "payment")

        assert result["analysis_failed"] is True

    def test_succeeds_when_groq_fails_but_gemini_returns_valid(self):
        """Groq raises, Gemini returns valid schema → must succeed with analysis_failed=False."""
        groq_mock = MagicMock()
        genai_mock = MagicMock()
        with patch.dict("sys.modules", {"groq": groq_mock, "google.generativeai": genai_mock}):
            if "app.services.llm_service" in sys.modules:
                del sys.modules["app.services.llm_service"]
            import app.services.llm_service as llm_mod

            valid_response = {
                "risk_level": "Medium",
                "confidence": 0.75,
                "risk_reasoning": "Clause limits liability asymmetrically.",
                "bias_label": "favours_party_b",
                "bias_confidence": 0.65,
                "alternative_clause": "Liability shall be shared equally.",
                "alternative_reasoning": "Creates balanced risk allocation.",
            }

            llm_mod.analyze_clause_with_groq = MagicMock(side_effect=Exception("Groq down"))
            llm_mod.analyze_clause_with_gemini = MagicMock(return_value=valid_response)

            result = llm_mod.analyze_clause("Liability clause.", "vendor", "liability")

        assert result["analysis_failed"] is False
        assert result["risk_level"] == "Medium"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
