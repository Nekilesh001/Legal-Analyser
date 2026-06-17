"""
Direct seed - inserts users with pre-hashed passwords using psycopg2 directly.
"""
import psycopg2
import os
from pathlib import Path

# Read backend .env
env = {}
env_path = Path("backend/.env")
for line in env_path.read_text().splitlines():
    line = line.strip()
    if "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()

db_url = env.get("DATABASE_URL", "")
# Parse: postgresql://postgres:neki132506@localhost:5432/lexclarity_db
import re
m = re.match(r"postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/(.+)", db_url)
user, password, host, port, dbname = m.groups()

conn = psycopg2.connect(dbname=dbname, user=user, password=password, host=host, port=int(port))
cur = conn.cursor()

# Check existing tables
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
tables = [r[0] for r in cur.fetchall()]
print("Tables:", tables)

# Check existing users
cur.execute("SELECT id, username, role FROM users")
existing_users = cur.fetchall()
print("Existing users:", existing_users)

# Use bcrypt2 directly for password hashing
import subprocess, sys
# Install bcrypt if needed
try:
    import bcrypt
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "bcrypt"])
    import bcrypt

def hash_pw(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

USERS = [
    ("admin",       "admin@lexclarity.in",       hash_pw("LexAdmin@2024!"),   "admin"),
    ("mock_admin",  "mock_admin@lexclarity.com",  hash_pw("MockAdmin@2024!"),  "admin"),
    ("testuser_v2", "testuser_v2@lexclarity.in",  hash_pw("TestUser@2024!"),   "user"),
]

existing_usernames = {r[1] for r in existing_users}
for username, email, hashed_pw, role in USERS:
    if username in existing_usernames:
        print(f"  Exists: '{username}'")
    else:
        cur.execute(
            "INSERT INTO users (username, email, hashed_password, role, is_active) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (username, email, hashed_pw, role, True)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        print(f"  Created: '{username}' ID={new_id}, role={role}")

print("\nFinal users:")
cur.execute("SELECT id, username, role, is_active FROM users ORDER BY id")
for row in cur.fetchall():
    print(f"  ID={row[0]}  username={row[1]}  role={row[2]}  active={row[3]}")

conn.close()
