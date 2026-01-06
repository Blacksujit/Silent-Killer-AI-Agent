"""
Ambient Intelligence API
Silent, proactive intelligence that observes and improves workflows
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging
import asyncio

from ..core.auth import verify_api_key
from ..ambient.mock_agent import get_mock_agent
from ..core.store import store

logger = logging.getLogger(__name__)
router = APIRouter()

class ContextData(BaseModel):
    user_id: str
    context: Dict[str, Any]

class ObservationRequest(BaseModel):
    user_id: str
    context: Dict[str, Any]
    events: Optional[List[Dict]] = None

class ObservationResponse(BaseModel):
    success: bool
    message: str
    insights: Optional[Dict[str, Any]] = None

class InsightsResponse(BaseModel):
    success: bool
    insights: Dict[str, Any]
    error: Optional[str] = None

@router.post("/observe", response_model=ObservationResponse)
async def observe_user(
    request: ObservationRequest,
    background_tasks: BackgroundTasks,
    _ok: bool = Depends(verify_api_key)
):
    """
    Main ambient intelligence endpoint
    Observes user behavior and automatically improves workflows
    """
    try:
        agent = get_mock_agent()
        
        # Process observation in background (non-blocking)
        background_tasks.add_task(
            agent.observe_user,
            request.user_id,
            request.context
        )
        
        # Also store any events if provided
        if request.events:
            for event in request.events:
                try:
                    normalized = normalize_event(event)
                    store.add_event(request.user_id, normalized)
                except Exception as e:
                    logger.error(f"Error storing event: {e}")
        
        return ObservationResponse(
            success=True,
            message="Observation processed"
        )
    except Exception as e:
        logger.error(f"Error in observe endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights/{user_id}", response_model=InsightsResponse)
async def get_ambient_insights(
    user_id: str,
    _ok: bool = Depends(verify_api_key)
):
    """
    Get current ambient insights for a user
    """
    try:
        agent = get_mock_agent()
        insights = agent.get_user_insights(user_id)
        
        return InsightsResponse(
            success=True,
            insights=insights
        )
    except Exception as e:
        logger.error(f"Error getting insights: {e}")
        return InsightsResponse(
            success=False,
            error=str(e)
        )

@router.post("/context")
async def update_context(
    request: ContextData,
    background_tasks: BackgroundTasks,
    _ok: bool = Depends(verify_api_key)
):
    """
    Update user context (called continuously by monitoring agents)
    """
    try:
        agent = get_mock_agent()
        
        # Process context update in background
        background_tasks.add_task(
            agent.observe_user,
            request.user_id,
            request.context
        )
        
        return {"success": True, "message": "Context updated"}
    except Exception as e:
        logger.error(f"Error updating context: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trigger-analysis/{user_id}")
async def trigger_analysis(
    user_id: str,
    _ok: bool = Depends(verify_api_key)
):
    """Manually trigger ambient analysis (for testing).

    For the mock agent we don't have a full analysis pipeline. Instead, we
    simulate an analysis pass by sending a synthetic context through
    `observe_user`, which updates the in-memory user state and insights.
    """
    try:
        agent = get_mock_agent()

        from datetime import datetime

        context = {
            "timestamp": datetime.now().isoformat(),
            "trigger": "manual",
        }

        # Reuse the existing observation path to update user state/insights
        await agent.observe_user(user_id, context)

        return {"success": True, "message": "Analysis triggered"}
    except Exception as e:
        logger.error(f"Error triggering analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_ambient_status(_ok: bool = Depends(verify_api_key)):
    """
    Get ambient intelligence system status
    """
    try:
        agent = get_mock_agent()
        
        status = {
            "active_users": len(agent.user_states),
            "last_analyses": agent.last_analysis,
            "system_health": "healthy",
            "timestamp": datetime.now().isoformat()
        }
        
        return status
    except Exception as e:
        logger.error(f"Error getting status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper function from ingest.py
def normalize_event(event):
    """Normalize event data"""
    return {
        "user_id": event.get("user_id"),
        "event_id": event.get("event_id"),
        "timestamp": event.get("timestamp"),
        "type": event.get("type"),
        "meta": event.get("meta", {})
    }
