"""
Anomaly Detection Service — Z-score based health score anomaly detection.
Requires minimum 10 historical analyses of same contract type before calculating.
Returns None if insufficient data (never computes a meaningless statistic).
"""
import logging
from typing import Optional
import numpy as np

logger = logging.getLogger(__name__)

MIN_SAMPLE_SIZE = 10
ZSCORE_THRESHOLD = 2.0


def detect_anomaly(
    health_score: Optional[float],
    contract_type: str,
    user_id: int,
    db,
    admin_scope: bool = False
) -> Optional[bool]:
    """
    Detect if a health score is anomalous given historical context.

    Args:
        health_score: The new analysis's health score (None if analysis failed).
        contract_type: Type of contract for grouping.
        user_id: Current user ID (used unless admin_scope=True).
        db: SQLAlchemy session.
        admin_scope: If True, compare against all users' data.

    Returns:
        True if anomalous, False if normal, None if insufficient data.
    """
    if health_score is None:
        return None

    try:
        from app.models.analysis import Analysis
        from app.models.contract import Contract

        query = (
            db.query(Analysis.health_score)
            .join(Contract, Analysis.contract_id == Contract.id)
            .filter(
                Contract.contract_type == contract_type,
                Analysis.health_score.isnot(None)
            )
        )

        if not admin_scope:
            query = query.filter(Contract.user_id == user_id)

        historical_scores = [row[0] for row in query.all()]

        if len(historical_scores) < MIN_SAMPLE_SIZE:
            logger.info(
                f"Insufficient historical data for anomaly detection: "
                f"{len(historical_scores)} < {MIN_SAMPLE_SIZE} required for {contract_type}"
            )
            return None

        scores_array = np.array(historical_scores, dtype=float)
        mean = np.mean(scores_array)
        std = np.std(scores_array)

        if std == 0:
            # All scores identical, no anomaly possible
            return False

        z_score = abs(health_score - mean) / std
        is_anomalous = z_score > ZSCORE_THRESHOLD

        logger.info(
            f"Anomaly check: score={health_score:.1f}, "
            f"mean={mean:.1f}, std={std:.1f}, z={z_score:.2f}, "
            f"anomalous={is_anomalous}"
        )
        return is_anomalous

    except Exception as e:
        logger.warning(f"Anomaly detection failed: {e}")
        return None


def get_anomaly_stats(contract_type: str, user_id: int, db, admin_scope: bool = False) -> dict:
    """
    Return statistical summary for a contract type's health scores.
    Used by the analytics endpoint to surface aggregate insights.
    """
    try:
        from app.models.analysis import Analysis
        from app.models.contract import Contract

        query = (
            db.query(Analysis.health_score)
            .join(Contract, Analysis.contract_id == Contract.id)
            .filter(
                Contract.contract_type == contract_type,
                Analysis.health_score.isnot(None)
            )
        )

        if not admin_scope:
            query = query.filter(Contract.user_id == user_id)

        scores = [row[0] for row in query.all()]

        if len(scores) < MIN_SAMPLE_SIZE:
            return {"available": False, "count": len(scores), "min_required": MIN_SAMPLE_SIZE}

        arr = np.array(scores, dtype=float)
        return {
            "available": True,
            "count": len(scores),
            "mean": round(float(np.mean(arr)), 1),
            "std": round(float(np.std(arr)), 1),
            "min": round(float(np.min(arr)), 1),
            "max": round(float(np.max(arr)), 1),
            "p25": round(float(np.percentile(arr, 25)), 1),
            "p75": round(float(np.percentile(arr, 75)), 1),
        }
    except Exception as e:
        logger.warning(f"Anomaly stats failed: {e}")
        return {"available": False, "error": str(e)}
