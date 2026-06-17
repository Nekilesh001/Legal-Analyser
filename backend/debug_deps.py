from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
from app.core.dependencies import get_current_user
from app.models.user import User

app = FastAPI()

@app.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "username": user.username, "role": user.role}

client = TestClient(app)

# Test mock-user-token
res = client.get("/me", headers={"Authorization": "Bearer mock-user-token"})
print("mock-user-token:", res.json())

# Test mock-admin-token
res2 = client.get("/me", headers={"Authorization": "Bearer mock-admin-token"})
print("mock-admin-token:", res2.json())

# Test no token
res3 = client.get("/me")
print("no token:", res3.json())
