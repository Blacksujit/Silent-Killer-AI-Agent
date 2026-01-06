"""System metrics API: expose last OS metrics per user based on system_metrics events."""
import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException

from .core.auth import verify_api_key  # type: ignore
from .core.store import store  # type: ignore

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/system/metrics/{user_id}")
def get_system_metrics(user_id: str, _ok: bool = Depends(verify_api_key)) -> Dict[str, Any]:
    """Return the latest OS/system metrics for a given user.

    The native OS agent should periodically POST events of type `system_metrics`
    via the existing /api/ingest endpoint, with a meta payload like:

        {
            "cpu": <percent>,
            "memory": <percent>,
            "network": <0-100 load score>,
        }

    This endpoint simply looks up those events and returns the most recent one
    for the caller to use in the dashboard.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    try:
        events = store.get_events(user_id, None) or []
    except Exception as e:  # pragma: no cover - defensive
        logger.error(f"Error loading events for metrics: {e}")
        events = []

    metrics_events = [e for e in events if e.get("type") == "system_metrics"]
    if not metrics_events:
        return {"user_id": user_id, "has_data": False, "metrics": {}, "timestamp": None}

    # Pick the latest by timestamp
    latest = max(
        metrics_events,
        key=lambda e: e.get("timestamp") or "",
    )
    ts = latest.get("timestamp")
    if hasattr(ts, "isoformat"):
        ts = ts.isoformat()

    meta = latest.get("meta", {}) or {}

    return {
        "user_id": user_id,
        "has_data": True,
        "metrics": meta,
        "timestamp": ts,
    }
