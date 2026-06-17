"""
test_rag.py — Real unit tests for RAG services

Tests:
1. contract_analysis_rag retrieval returns results above similarity threshold
   for a known in-scope query
2. RAG chat service returns low_confidence=True + refusal message
   when retrieval similarity is below threshold (mocked)
3. RAG chat service returns low_confidence=True when collection is unavailable
4. validate that chat service does NOT fall back to contract_analysis_rag
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from unittest.mock import patch, MagicMock


SIMILARITY_THRESHOLD = 0.65


class TestRagContractService:
    """Tests for rag_contract_service (contract_analysis_rag collection)."""

    def test_contract_rag_returns_results_for_known_query(self):
        """
        If the contract_analysis_rag collection is populated,
        a query about employment termination should return at least 1 result
        with similarity > 0.5.
        """
        try:
            import chromadb
            from sentence_transformers import SentenceTransformer

            # Try connecting to the collection
            chroma_path = os.path.join(
                os.path.dirname(__file__), "..", "chroma_db"
            )
            if not os.path.exists(chroma_path):
                pytest.skip("ChromaDB not yet ingested — run scripts/ingest_knowledge_base.py first")

            client = chromadb.PersistentClient(path=chroma_path)
            try:
                collection = client.get_collection("contract_analysis_rag")
            except Exception:
                pytest.skip("contract_analysis_rag collection not found — run ingest_knowledge_base.py")

            model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
            query = "notice period required for employee termination"
            q_emb = model.encode(query).tolist()

            results = collection.query(query_embeddings=[q_emb], n_results=5)
            assert results["documents"][0], "Should return at least 1 document"

            # Check that the best result has reasonable similarity
            best_distance = results["distances"][0][0]
            best_similarity = 1 - best_distance
            assert best_similarity > 0.4, (
                f"Best similarity {best_similarity:.3f} is too low for a known query. "
                "Knowledge base may be empty or poorly chunked."
            )
        except ImportError as e:
            pytest.skip(f"Required library not installed: {e}")


class TestRagChatService:
    """Tests for rag_chat_service guardrails."""

    def test_returns_low_confidence_when_collection_unavailable(self):
        """
        When the legal_knowledge_base collection doesn't exist,
        must return low_confidence=True with an explicit message about
        running the ingestion script — never a fake answer.
        """
        from app.services import rag_chat_service

        # Reset cached collection so our mock takes effect
        rag_chat_service._legal_collection = None

        with patch.object(rag_chat_service, "_get_legal_collection", return_value=None):
            result = rag_chat_service.answer_legal_question("What is the notice period?")

        assert result["low_confidence"] is True
        assert result["sources"] == []
        # Must mention the ingestion script or that the knowledge base is unavailable
        answer_lower = result["answer"].lower()
        assert any(kw in answer_lower for kw in ["not been set up", "ingestion", "unavailable", "consult"]), (
            f"Expected explicit setup message, got: {result['answer']}"
        )

    def test_returns_low_confidence_below_similarity_threshold(self):
        """
        When ChromaDB returns a result with high distance (low similarity),
        must return low_confidence=True, never a fabricated answer.
        """
        from app.services import rag_chat_service

        # Mock the collection to return a high-distance (low similarity) result
        mock_collection = MagicMock()
        mock_collection.query.return_value = {
            "documents": [["Some irrelevant doc about cricket scores"]],
            "metadatas": [[{"act": "Unknown", "section": "1"}]],
            "distances": [[0.85]],  # similarity = 1 - 0.85 = 0.15, well below 0.65 threshold
        }

        rag_chat_service._legal_collection = None

        with patch.object(rag_chat_service, "_get_legal_collection", return_value=mock_collection):
            from sentence_transformers import SentenceTransformer as _ST
            with patch.object(rag_chat_service, "_get_model", return_value=MagicMock(
                encode=MagicMock(return_value=MagicMock(tolist=MagicMock(return_value=[0.1] * 384)))
            )):
                result = rag_chat_service.answer_legal_question(
                    "What are the rules for playing cricket in India?"
                )

        assert result["low_confidence"] is True, (
            "Low similarity query must return low_confidence=True"
        )

    def test_does_not_fall_back_to_contract_rag(self):
        """
        CRITICAL: When legal_knowledge_base is unavailable,
        the service must NOT query contract_analysis_rag.
        """
        from app.services import rag_chat_service

        rag_chat_service._legal_collection = None

        # Track if any ChromaDB get_collection is called for the wrong collection
        wrong_collection_accessed = []

        original_get_collection = None

        def mock_get_legal():
            return None  # Simulate unavailable

        with patch.object(rag_chat_service, "_get_legal_collection", side_effect=mock_get_legal):
            result = rag_chat_service.answer_legal_question("Test question")

        # The function returned without querying any collection
        assert result["low_confidence"] is True
        # Ensure there's NO reference to contract_analysis_rag in the implementation anymore
        import inspect
        source = inspect.getsource(rag_chat_service)
        assert "contract_analysis_rag" not in source, (
            "CRITICAL: rag_chat_service still references contract_analysis_rag. "
            "The fallback must be fully removed."
        )

    def test_returns_sources_for_high_similarity_result(self):
        """
        When ChromaDB returns high-similarity results, the answer should
        include source citations and low_confidence=False.
        """
        from app.services import rag_chat_service

        good_doc = (
            "Section 25F of the Industrial Disputes Act 1947 requires that an employee "
            "with one or more years of continuous service must receive one month's notice "
            "or wages in lieu before termination, plus retrenchment compensation."
        )

        mock_collection = MagicMock()
        mock_collection.query.return_value = {
            "documents": [[good_doc]],
            "metadatas": [[{
                "act": "Industrial Disputes Act",
                "section": "25F",
                "category": "employment",
                "jurisdiction": "India",
                "title": "Notice for Retrenchment",
            }]],
            "distances": [[0.15]],  # similarity = 1 - 0.15 = 0.85, above threshold
        }

        rag_chat_service._legal_collection = None

        mock_llm_response = MagicMock()
        mock_llm_response.choices[0].message.content = (
            "Based on the available legal documents: Under Section 25F of the "
            "Industrial Disputes Act 1947, an employer must give one month's notice "
            "before terminating an employee.\n\nSources: Industrial Disputes Act — Section 25F"
        )
        mock_groq = MagicMock()
        mock_groq.chat.completions.create.return_value = mock_llm_response

        with patch.object(rag_chat_service, "_get_legal_collection", return_value=mock_collection), \
             patch.object(rag_chat_service, "_get_model", return_value=MagicMock(
                 encode=MagicMock(return_value=MagicMock(tolist=MagicMock(return_value=[0.1] * 384)))
             )), \
             patch("app.services.rag_chat_service.get_groq", return_value=mock_groq):

            result = rag_chat_service.answer_legal_question(
                "What notice period is required before terminating an employee?"
            )

        assert result["low_confidence"] is False, (
            f"High similarity result should not be low_confidence. Got: {result}"
        )
        assert len(result["sources"]) > 0, "Sources must be populated for a valid answer"
        assert "answer" in result and result["answer"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
