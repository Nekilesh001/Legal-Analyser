"""
Direct seed script - seeds users directly via SQLAlchemy using the backend .env
"""
import sys, os

# Add backend directory to path
sys.path.insert(0, os.path.abspath("backend"))

# Load the backend .env
from dotenv import load_dotenv
load_dotenv(os.path.join("backend", ".env"))

from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.contract import Contract
from app.models.analysis import Analysis
from app.core.security import hash_password

# Create all tables if they don't exist
print("Creating tables if not exist...")
Base.metadata.create_all(bind=engine)
print("Tables ready.")

USERS = [
    {"username": "admin",        "email": "admin@lexclarity.in",        "password": "LexAdmin@2024!",   "role": "admin"},
    {"username": "mock_admin",   "email": "mock_admin@lexclarity.com",  "password": "MockAdmin@2024!",  "role": "admin"},
    {"username": "testuser_v2",  "email": "testuser_v2@lexclarity.in",  "password": "TestUser@2024!",   "role": "user"},
]

db = SessionLocal()
try:
    for u in USERS:
        existing = db.query(User).filter(User.username == u["username"]).first()
        if existing:
            print(f"  Exists: '{u['username']}' (ID={existing.id}, role={existing.role})")
        else:
            user = User(
                username=u["username"],
                email=u["email"],
                hashed_password=hash_password(u["password"]),
                role=u["role"],
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"  Created: '{u['username']}' ID={user.id}, role={u['role']}")
    
    print("\nAll users in DB:")
    for u in db.query(User).all():
        print(f"  ID={u.id}  username={u.username}  role={u.role}  active={u.is_active}")
finally:
    db.close()
