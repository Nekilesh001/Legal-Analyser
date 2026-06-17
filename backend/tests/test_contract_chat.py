import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from app.services.contract_chat_service import answer_contract_question

class TestContractChatService:

    @patch("app.services.contract_chat_service.get_groq")
    @patch("app.services.contract_chat_service._get_legal_collection")
    @patch("app.services.contract_chat_service._get_model")
    def test_contract_chat_success(self, mock_get_model, mock_get_legal_collection, mock_get_groq):
        """Verify successful contract chat flow under correct owner permissions with cited laws."""
        # 1. Mock database session with self-returning filter queries
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        
        mock_user = MagicMock()
        mock_user.id = 4
        mock_user.role = "user"
        
        mock_contract = MagicMock()
        mock_contract.id = 101
        mock_contract.user_id = 4
        mock_contract.filename = "employment_contract.pdf"
        mock_contract.contract_type = "employment"
        
        mock_analysis = MagicMock()
        mock_analysis.health_score = 85.0
        mock_analysis.bias_buyer_pct = 20.0
        mock_analysis.bias_vendor_pct = 10.0
        mock_analysis.bias_neutral_pct = 70.0
        mock_analysis.clause_results = [
            {"clause_id": "abc123xyz", "text": "The Employee must work 40 hours.", "risk_level": "Low"}
        ]
        mock_analysis.missing_clauses = []
        mock_analysis.negotiation_playbook = []
        
        # Setup DB mock queries sequentially: user -> contract -> analysis
        mock_query.first.side_effect = [
            mock_user,
            mock_contract,
            mock_analysis
        ]
        
        # 2. Mock ChromaDB to return high-similarity result (above 0.65 threshold)
        mock_collection = MagicMock()
        mock_get_legal_collection.return_value = mock_collection
        
        # Cosine distance = 0.2 (similarity = 0.8)
        mock_collection.query.return_value = {
            "documents": [["Termination requires 30 days notice under the Act."]],
            "metadatas": [[{"act": "Payment of Wages Act", "section": "3"}]],
            "distances": [[0.2]]
        }
        
        # Mock model encoder
        mock_model = MagicMock()
        mock_get_model.return_value = mock_model
        mock_model.encode.return_value.tolist.return_value = [0.1, 0.2]
        
        # 3. Mock Groq chat completions
        mock_client = MagicMock()
        mock_get_groq.return_value = mock_client
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"answer": "Based on the contract, the employee works 40 hours, and under Payment of Wages Act Section 3 notice must be given.", "referenced_clauses": ["abc123xyz"]}'
        mock_client.chat.completions.create.return_value = mock_response

        # 4. Execute service call
        result = answer_contract_question(
            contract_id=101,
            question="what are my working hours?",
            user_id=4,
            db=mock_db
        )
        
        # 5. Assertions
        assert result["contract_id"] == 101
        assert "40 hours" in result["answer"]
        assert "Payment of Wages Act" in result["law_sources"][0]
        assert "abc123xyz" in result["referenced_clauses"]
        assert mock_db.add.called
        assert mock_db.commit.called

    @patch("app.services.contract_chat_service.get_groq")
    @patch("app.services.contract_chat_service._get_legal_collection")
    @patch("app.services.contract_chat_service._get_model")
    def test_contract_chat_no_fabricated_citations(self, mock_get_model, mock_get_legal_collection, mock_get_groq):
        """Ensure no law citations are fabricated if ChromaDB returns no results above the 0.65 threshold."""
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        
        mock_user = MagicMock(id=4, role="user")
        mock_contract = MagicMock(id=101, user_id=4, filename="lease.pdf", contract_type="lease")
        
        mock_analysis = MagicMock()
        mock_analysis.health_score = 90.0
        mock_analysis.bias_buyer_pct = 0.0
        mock_analysis.bias_vendor_pct = 0.0
        mock_analysis.bias_neutral_pct = 100.0
        mock_analysis.clause_results = []
        mock_analysis.missing_clauses = []
        mock_analysis.negotiation_playbook = []
        
        mock_query.first.side_effect = [
            mock_user,
            mock_contract,
            mock_analysis
        ]
        
        # Mock ChromaDB to return low-similarity result (similarity = 1 - 0.5 = 0.5 < 0.65)
        mock_collection = MagicMock()
        mock_get_legal_collection.return_value = mock_collection
        mock_collection.query.return_value = {
            "documents": [["Rent control excerpt..."]],
            "metadatas": [[{"act": "Tamil Nadu Buildings Act", "section": "4"}]],
            "distances": [[0.5]]  # Cosine distance = 0.5 -> Similarity = 0.5
        }
        
        mock_model = MagicMock()
        mock_get_model.return_value = mock_model
        mock_model.encode.return_value.tolist.return_value = [0.1, 0.2]
        
        mock_client = MagicMock()
        mock_get_groq.return_value = mock_client
        mock_response = MagicMock()
        # Mock LLM response to comply with "no fabrication"
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"answer": "The contract does not specify rent control guidelines and no relevant acts were found.", "referenced_clauses": []}'
        mock_client.chat.completions.create.return_value = mock_response

        result = answer_contract_question(
            contract_id=101,
            question="does rent control apply here?",
            user_id=4,
            db=mock_db
        )
        
        # Verify law sources is empty because similarity (0.5) is below threshold (0.65)
        assert len(result["law_sources"]) == 0
        assert "no relevant acts were found" in result["answer"]

    @patch("app.services.contract_chat_service.get_groq")
    @patch("app.services.contract_chat_service._get_legal_collection")
    @patch("app.services.contract_chat_service._get_model")
    def test_contract_chat_out_of_scope(self, mock_get_model, mock_get_legal_collection, mock_get_groq):
        """Verify the bot refuses to answer contract-irrelevant questions."""
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        
        mock_user = MagicMock(id=4, role="user")
        mock_contract = MagicMock(id=101, user_id=4, filename="vendor.pdf", contract_type="vendor")
        
        mock_analysis = MagicMock()
        mock_analysis.health_score = 80.0
        mock_analysis.bias_buyer_pct = 0.0
        mock_analysis.bias_vendor_pct = 0.0
        mock_analysis.bias_neutral_pct = 100.0
        mock_analysis.clause_results = []
        mock_analysis.missing_clauses = []
        mock_analysis.negotiation_playbook = []
        
        mock_query.first.side_effect = [
            mock_user,
            mock_contract,
            mock_analysis
        ]
        
        mock_collection = MagicMock()
        mock_get_legal_collection.return_value = mock_collection
        mock_collection.query.return_value = {"documents": [], "metadatas": [], "distances": []}
        
        mock_model = MagicMock()
        mock_get_model.return_value = mock_model
        mock_model.encode.return_value.tolist.return_value = [0.1, 0.2]
        
        mock_client = MagicMock()
        mock_get_groq.return_value = mock_client
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"answer": "This question is outside the scope of this contract workspace.", "referenced_clauses": []}'
        mock_client.chat.completions.create.return_value = mock_response

        result = answer_contract_question(
            contract_id=101,
            question="how do I bake chocolate cookies?",
            user_id=4,
            db=mock_db
        )
        
        assert "outside the scope" in result["answer"]
        assert len(result["law_sources"]) == 0

    def test_contract_chat_permission_denied(self):
        """Verify that a regular user cannot chat about a contract owned by someone else."""
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        
        mock_user = MagicMock(id=4, role="user")
        mock_contract = None  # Mocking that query returns None when user_id is checked
        
        mock_query.first.side_effect = [
            mock_user,
            mock_contract
        ]
        
        with pytest.raises(HTTPException) as exc_info:
            answer_contract_question(
                contract_id=102,
                question="what is this?",
                user_id=4,
                db=mock_db
            )
            
        assert exc_info.value.status_code == 404
        assert exc_info.value.detail == "Contract not found"

    @patch("app.services.contract_chat_service.get_groq")
    @patch("app.services.contract_chat_service._get_legal_collection")
    @patch("app.services.contract_chat_service._get_model")
    def test_contract_chat_admin_success(self, mock_get_model, mock_get_legal_collection, mock_get_groq):
        """Verify that an admin can chat about any contract (even if owned by another user)."""
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        
        mock_user = MagicMock(id=1, role="admin")
        mock_contract = MagicMock(id=102, user_id=5, filename="other_user_contract.pdf", contract_type="vendor")
        
        mock_analysis = MagicMock()
        mock_analysis.health_score = 75.0
        mock_analysis.bias_buyer_pct = 0.0
        mock_analysis.bias_vendor_pct = 0.0
        mock_analysis.bias_neutral_pct = 100.0
        mock_analysis.clause_results = []
        mock_analysis.missing_clauses = []
        mock_analysis.negotiation_playbook = []
        
        mock_query.first.side_effect = [
            mock_user,
            mock_contract,
            mock_analysis
        ]
        
        mock_collection = MagicMock()
        mock_get_legal_collection.return_value = mock_collection
        mock_collection.query.return_value = {"documents": [], "metadatas": [], "distances": []}
        
        mock_model = MagicMock()
        mock_get_model.return_value = mock_model
        mock_model.encode.return_value.tolist.return_value = [0.1, 0.2]
        
        mock_client = MagicMock()
        mock_get_groq.return_value = mock_client
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"answer": "Admin access granted. Contract reviews are healthy.", "referenced_clauses": []}'
        mock_client.chat.completions.create.return_value = mock_response

        result = answer_contract_question(
            contract_id=102,
            question="is this contract secure?",
            user_id=1,  # Admin user ID
            db=mock_db
        )
        
        assert "Admin access granted" in result["answer"]
