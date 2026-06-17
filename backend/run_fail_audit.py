import requests
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.contract import Contract

db = SessionLocal()

# Get testuser_v2
test_user = db.query(User).filter(User.username == "testuser_v2").first()
print(f"Selected User for Test: ID={test_user.id}, Username={test_user.username}")

# Insert dummy contract using SQLAlchemy
contract = Contract(
    filename="fail_test.pdf",
    file_hash="fail_hash_123",
    contract_type="employment",
    raw_text="",  # Empty string to trigger the failure path!
    user_id=test_user.id
)
db.add(contract)
db.commit()
db.refresh(contract)
print(f"Inserted contract ID: {contract.id} with empty raw_text.")

# Call the API
url = f"http://localhost:8000/analysis/run/{contract.id}"
headers = {"Authorization": "Bearer mock-user-token"}

try:
    print(f"Calling POST {url}...")
    res = requests.post(url, headers=headers)
    print(f"API Response Status Code: {res.status_code}")
    print(f"API Response JSON:\n{res.text}")
except Exception as e:
    print(f"Request failed: {e}")

# Clean up
db.delete(contract)
db.commit()
print("Cleaned up contract.")
db.close()
