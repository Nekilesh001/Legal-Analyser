# Audit logging service
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

def log_action(db: Session, user_id: int, action: str, file_hash: str = None, details: str = None):
    db_log = AuditLog(user_id=user_id, action=action, file_hash=file_hash, details=details)
    db.add(db_log)
    db.commit()
