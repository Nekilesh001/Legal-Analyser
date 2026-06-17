from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserResponse, TokenResponse

router = APIRouter()

class DevSessionRequest(BaseModel):
    role: str

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed = hash_password(user_in.password)
    new_user = User(username=user_in.username, email=user_in.email, hashed_password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "role": user.role}

@router.post("/dev-session", response_model=TokenResponse)
def dev_session(payload: DevSessionRequest, db: Session = Depends(get_db)):
    if payload.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")
    
    username = "dev_admin" if payload.role == "admin" else "dev_user"
    email = f"{username}@lexclarity.in"
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        hashed = hash_password(f"DevPassword@{payload.role.capitalize()}2024!")
        user = User(
            username=username,
            email=email,
            hashed_password=hashed,
            role=payload.role,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "role": user.role}
