"""
Admin Router — User management endpoints for admin role.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.models.contract import Contract
from app.models.analysis import Analysis

router = APIRouter()


@router.get("/users")
def list_all_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
):
    """Admin: list all registered users with contract counts."""
    users = db.query(User).all()
    result = []
    for u in users:
        contract_count = db.query(Contract).filter(Contract.user_id == u.id).count()
        result.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "contract_count": contract_count
        })
    return result


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin: activate or deactivate a user account."""
    if user_id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    db.commit()
    return {"id": user.id, "username": user.username, "is_active": user.is_active}


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin: change a user's role (user/admin)."""
    if role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")
    if user_id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role
    db.commit()
    return {"id": user.id, "username": user.username, "role": user.role}


@router.get("/users/{user_id}/contracts")
def get_user_contracts(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
):
    """Admin: view all contracts for a specific user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    contracts = db.query(Contract).filter(Contract.user_id == user_id).all()
    result = []
    for c in contracts:
        analysis = db.query(Analysis).filter(Analysis.contract_id == c.id).first()
        result.append({
            "id": c.id,
            "filename": c.filename,
            "contract_type": c.contract_type,
            "detected_language": c.detected_language,
            "extraction_method": c.extraction_method,
            "uploaded_at": c.uploaded_at.isoformat() if c.uploaded_at else None,
            "analysis": {
                "health_score": analysis.health_score if analysis else None,
                "high_risk_count": analysis.high_risk_count if analysis else None,
            } if analysis else None
        })
    return result
