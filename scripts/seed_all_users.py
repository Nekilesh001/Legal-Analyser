"""
Seed initial users: admin + mock_admin (for development bypass).
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

from app.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

USERS_TO_SEED = [
    {
        "username": "admin",
        "email": "admin@lexclarity.in",
        "password": "LexAdmin@2024!",
        "role": "admin",
    },
    {
        "username": "mock_admin",
        "email": "mock_admin@lexclarity.com",
        "password": "MockAdmin@2024!",
        "role": "admin",
    },
    {
        "username": "testuser_v2",
        "email": "testuser_v2@lexclarity.in",
        "password": "TestUser@2024!",
        "role": "user",
    },
]


def seed_users():
    db = SessionLocal()
    try:
        for u in USERS_TO_SEED:
            existing = db.query(User).filter(User.username == u["username"]).first()
            if existing:
                # Update role if needed
                if existing.role != u["role"]:
                    existing.role = u["role"]
                    db.commit()
                    print(f"Updated role for '{u['username']}' to '{u['role']}'")
                else:
                    print(f"User '{u['username']}' already exists (ID: {existing.id}, role={existing.role})")
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
                print(f"✅ Created user '{u['username']}' ID={user.id}, role={u['role']}")
        print("\nAll users seeded.")
        users = db.query(User).all()
        for usr in users:
            print(f"  ID={usr.id}  username={usr.username}  role={usr.role}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()
