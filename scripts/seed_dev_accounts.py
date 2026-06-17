"""
Seed Dev Accounts Script.
Creates the dev_user and dev_admin accounts in the database.
Run: python scripts/seed_dev_accounts.py
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from app.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

DEV_ACCOUNTS = [
    {
        "username": "dev_user",
        "email": "dev_user@lexclarity.in",
        "password": "DevPassword@User2024!",
        "role": "user"
    },
    {
        "username": "dev_admin",
        "email": "dev_admin@lexclarity.in",
        "password": "DevPassword@Admin2024!",
        "role": "admin"
    }
]

def seed_dev_accounts():
    db = SessionLocal()
    try:
        for acc in DEV_ACCOUNTS:
            existing = db.query(User).filter(User.username == acc["username"]).first()
            if existing:
                print(f"Dev user '{acc['username']}' already exists (ID: {existing.id})")
                if existing.role != acc["role"]:
                    existing.role = acc["role"]
                    db.commit()
                    print(f"Role updated to '{acc['role']}'")
            else:
                user = User(
                    username=acc["username"],
                    email=acc["email"],
                    hashed_password=hash_password(acc["password"]),
                    role=acc["role"],
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"[OK] Dev user created: ID={user.id}, username={acc['username']}, role={acc['role']}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_dev_accounts()
