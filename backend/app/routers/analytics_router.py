"""
Analytics Router — Aggregate analytics endpoints for contract risk insights.
All queries are scoped by user_id for regular users;
admin role can query across all users.
"""
import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.contract import Contract
from app.models.analysis import Analysis
from app.services.anomaly_service import get_anomaly_stats

logger = logging.getLogger(__name__)
router = APIRouter()


def _base_query(db: Session, user_id: int | None, admin_scope: bool):
    """Return a base query scoped by user or all users for admin."""
    q = db.query(Analysis).join(Contract, Analysis.contract_id == Contract.id)
    if not admin_scope:
        q = q.filter(Contract.user_id == user_id)
    return q


@router.get("/summary")
def get_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get high-level summary stats for the current user's contracts."""
    q = _base_query(db, current_user.id, admin_scope=False)
    analyses = q.all()

    if not analyses:
        return {"total_contracts": 0, "avg_health_score": None, "total_high_risk": 0}

    scores = [a.health_score for a in analyses if a.health_score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else None

    return {
        "total_contracts": len(analyses),
        "avg_health_score": avg_score,
        "total_high_risk": sum(a.high_risk_count or 0 for a in analyses),
        "total_medium_risk": sum(a.medium_risk_count or 0 for a in analyses),
        "total_low_risk": sum(a.low_risk_count or 0 for a in analyses),
        "score_distribution": {
            "healthy": sum(1 for s in scores if s >= 75),
            "moderate": sum(1 for s in scores if 50 <= s < 75),
            "risky": sum(1 for s in scores if s < 50)
        }
    }


@router.get("/risk-distribution")
def get_risk_distribution(
    contract_type: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Risk distribution by contract type for the current user."""
    q = _base_query(db, current_user.id, admin_scope=False)
    if contract_type:
        q = q.filter(Contract.contract_type == contract_type)

    analyses = q.all()
    if not analyses:
        return []

    # Group by contract type
    grouped: dict[str, dict] = {}
    for a in analyses:
        contract = db.query(Contract).filter(Contract.id == a.contract_id).first()
        ct = (contract.contract_type or "other") if contract else "other"

        if ct not in grouped:
            grouped[ct] = {"contract_type": ct, "count": 0, "high": 0, "medium": 0, "low": 0, "scores": []}

        grouped[ct]["count"] += 1
        grouped[ct]["high"] += a.high_risk_count or 0
        grouped[ct]["medium"] += a.medium_risk_count or 0
        grouped[ct]["low"] += a.low_risk_count or 0
        if a.health_score is not None:
            grouped[ct]["scores"].append(a.health_score)

    result = []
    for ct, data in grouped.items():
        scores = data.pop("scores")
        data["avg_score"] = round(sum(scores) / len(scores), 1) if scores else None
        result.append(data)

    return sorted(result, key=lambda x: x["count"], reverse=True)


@router.get("/score-trend")
def get_score_trend(
    limit: int = Query(30, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Health score trend over time for the current user's analyses (most recent first)."""
    analyses = (
        _base_query(db, current_user.id, admin_scope=False)
        .filter(Analysis.health_score.isnot(None))
        .order_by(Analysis.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "date": a.created_at.strftime("%Y-%m-%d") if a.created_at else None,
            "health_score": a.health_score,
            "contract_id": a.contract_id,
            "risk_counts": {
                "high": a.high_risk_count,
                "medium": a.medium_risk_count,
                "low": a.low_risk_count
            }
        }
        for a in reversed(analyses)  # chronological order for chart
    ]


@router.get("/bias-distribution")
def get_bias_distribution(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggregate bias distribution across all user contracts."""
    analyses = _base_query(db, current_user.id, admin_scope=False).all()
    if not analyses:
        return {"buyer_pct": 0, "vendor_pct": 0, "neutral_pct": 0}

    buyer = sum(a.bias_buyer_pct or 0 for a in analyses)
    vendor = sum(a.bias_vendor_pct or 0 for a in analyses)
    neutral = sum(a.bias_neutral_pct or 0 for a in analyses)
    total = buyer + vendor + neutral

    if total == 0:
        return {"buyer_pct": 0, "vendor_pct": 0, "neutral_pct": 0}

    return {
        "buyer_pct": round((buyer / total) * 100, 1),
        "vendor_pct": round((vendor / total) * 100, 1),
        "neutral_pct": round((neutral / total) * 100, 1)
    }


@router.get("/missing-clauses-frequency")
def get_missing_clauses_frequency(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Most frequently flagged missing clauses across user's contracts."""
    analyses = _base_query(db, current_user.id, admin_scope=False).all()
    frequency: dict[str, int] = {}

    for a in analyses:
        if a.missing_clauses:
            for mc in a.missing_clauses:
                key = mc.get("missing_requirement", "Unknown")
                frequency[key] = frequency.get(key, 0) + 1

    return sorted(
        [{"clause": k, "count": v} for k, v in frequency.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:20]


@router.get("/anomaly-stats/{contract_type}")
def get_anomaly_stats_endpoint(
    contract_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistical anomaly summary for a contract type."""
    return get_anomaly_stats(contract_type, current_user.id, db, admin_scope=False)


# ─── Admin-Only Endpoints ────────────────────────────────────────────────────

@router.get("/admin/summary")
def admin_get_summary(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Admin: platform-wide summary across all users."""
    total_users = db.query(func.count(User.id)).scalar()
    total_contracts = db.query(func.count(Contract.id)).scalar()
    total_analyses = db.query(func.count(Analysis.id)).scalar()
    scores = db.query(Analysis.health_score).filter(Analysis.health_score.isnot(None)).all()
    score_vals = [s[0] for s in scores]
    avg_score = round(sum(score_vals) / len(score_vals), 1) if score_vals else None

    return {
        "total_users": total_users,
        "total_contracts": total_contracts,
        "total_analyses": total_analyses,
        "platform_avg_health_score": avg_score,
        "total_analyses_with_score": len(score_vals)
    }


@router.get("/admin/risk-distribution")
def admin_risk_distribution(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
):
    """Admin: cross-user risk distribution by contract type."""
    analyses = (
        db.query(Analysis)
        .join(Contract, Analysis.contract_id == Contract.id)
        .all()
    )

    grouped: dict[str, dict] = {}
    for a in analyses:
        contract = db.query(Contract).filter(Contract.id == a.contract_id).first()
        ct = (contract.contract_type or "other") if contract else "other"

        if ct not in grouped:
            grouped[ct] = {"contract_type": ct, "count": 0, "high": 0, "medium": 0, "low": 0, "scores": []}

        grouped[ct]["count"] += 1
        grouped[ct]["high"] += a.high_risk_count or 0
        grouped[ct]["medium"] += a.medium_risk_count or 0
        grouped[ct]["low"] += a.low_risk_count or 0
        if a.health_score is not None:
            grouped[ct]["scores"].append(a.health_score)

    result = []
    for ct, data in grouped.items():
        scores = data.pop("scores")
        data["avg_score"] = round(sum(scores) / len(scores), 1) if scores else None
        result.append(data)

    return sorted(result, key=lambda x: x["count"], reverse=True)
