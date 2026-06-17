"""
Seed Admin User Script.
Creates the initial admin user in the database.
Run: python scripts/seed_admin_user.py
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

ADMIN_USERNAME = "admin"
ADMIN_EMAIL = "admin@lexclarity.in"
ADMIN_PASSWORD = "LexAdmin@2024!"  # Change this immediately after first login


def seed_admin():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == ADMIN_USERNAME).first()
        if existing:
            print(f"Admin user '{ADMIN_USERNAME}' already exists (ID: {existing.id})")
            if existing.role != "admin":
                existing.role = "admin"
                db.commit()
                print("Role updated to 'admin'")
            return

        admin = User(
            username=ADMIN_USERNAME,
            email=ADMIN_EMAIL,
            hashed_password=hash_password(ADMIN_PASSWORD),
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"✅ Admin user created: ID={admin.id}, username={ADMIN_USERNAME}")
        print(f"   Email: {ADMIN_EMAIL}")
        print(f"   Password: {ADMIN_PASSWORD}")
        print(f"   ⚠️  CHANGE THE PASSWORD AFTER FIRST LOGIN!")

    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
