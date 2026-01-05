from fastapi import APIRouter, HTTPException, Depends
from ..core.auth import verify_api_key
from typing import List, Union
from ..models import Event
from ..core.store import store
from ..core.normalizer import normalize_event
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post('/ingest')
async def ingest_event(payload: Union[Event, List[Event]], _ok: bool = Depends(verify_api_key)):
    """Accept a single event or a list of events and store them."""
    events = payload if isinstance(payload, list) else [payload]
    logger.info(f"Received {len(events)} events for ingestion")
    
    stored = 0
    try:
        for ev in events:
            # pydantic Event -> dict (use model_dump to avoid Pydantic v2 deprecation)
            raw = ev.model_dump()
            normalized = normalize_event(raw)
            store.add_event(ev.user_id, normalized)
            stored += 1
        logger.info(f"Successfully stored {stored} events")
    except Exception as e:
        logger.error(f"Error during event ingestion: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
    return {"status": "accepted", "stored": stored}
