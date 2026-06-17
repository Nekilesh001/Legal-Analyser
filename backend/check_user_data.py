from app.database import SessionLocal
from app.models.user import User
from app.models.contract import Contract
from app.models.analysis import Analysis
from app.models.chat_history import ChatHistory

db = SessionLocal()

users = db.query(User).all()
print("Auditing users in database...")

seed_usernames = {"admin", "mock_admin", "testuser_v2"}

for u in users:
    c_count = db.query(Contract).filter(Contract.user_id == u.id).count()
    a_count = db.query(Analysis).join(Contract).filter(Contract.user_id == u.id).count()
    ch_count = db.query(ChatHistory).filter(ChatHistory.user_id == u.id).count()
    
    is_seed = u.username in seed_usernames
    user_type = "SEED" if is_seed else "REAL/NON-SEED"
    
    print(f"User ID: {u.id} | Username: {u.username} | Role: {u.role} | Type: {user_type}")
    print(f"  Contracts: {c_count} | Analyses: {a_count} | Chat History: {ch_count}")

db.close()
