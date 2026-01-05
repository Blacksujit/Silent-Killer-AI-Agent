from fastapi import APIRouter, HTTPException, Query, Depends
from ..core.auth import verify_api_key
from typing import Optional
from datetime import datetime

from ..core.store import store
from ..core.rules import ALL_RULES, run_rules_and_score
from ..core.ranker import rank_suggestions
from ..models import SuggestionResponse

router = APIRouter()


@router.get('/suggestions')
async def get_suggestions(user_id: str, since: Optional[datetime] = Query(None), _ok: bool = Depends(verify_api_key)):
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    events = store.get_events(user_id, since)
    suggestions = run_rules_and_score(events, ALL_RULES)
    # re-rank suggestions using intelligence core
    try:
        suggestions = rank_suggestions(suggestions, user_id)
    except Exception:
        # fallback: keep original order
        pass
    resp = SuggestionResponse(user_id=user_id, suggestions=suggestions)
    # use model_dump to avoid Pydantic v2 deprecation warnings
    return resp.model_dump()
