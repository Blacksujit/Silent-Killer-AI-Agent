from fastapi import APIRouter, HTTPException, Depends
from ..core.auth import verify_api_key
from ..models import Action, ActionResponse
from ..core.actions import action_store
from ..core import executor
from ..core import store as core_store_module

router = APIRouter()


@router.post('/actions')
async def post_action(payload: Action, _ok: bool = Depends(verify_api_key)):
    try:
        # persist action to the persistent store if available, else to in-memory action_store
        provider = getattr(core_store_module, 'store', None)
        rec = payload.model_dump()
        # Ensure timestamp is set
        if 'timestamp' not in rec or rec['timestamp'] is None:
            from datetime import datetime
            rec['timestamp'] = datetime.utcnow()
        # Extract suggestion metadata if available in the suggestion object
        if provider and hasattr(provider, 'add_action'):
            # SQLite store expects these fields
            provider.add_action(payload.user_id, rec)
        else:
            # In-memory store
            action_store.add_action(payload.user_id, rec)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ActionResponse(status='ok').model_dump()


@router.get('/actions')
async def get_actions(user_id: str, _ok: bool = Depends(verify_api_key)):
    if not user_id:
        raise HTTPException(status_code=400, detail='user_id required')
    # prefer persistent store actions if available
    provider = getattr(core_store_module, 'store', None)
    if provider and hasattr(provider, 'get_actions'):
        actions = provider.get_actions(user_id)
    else:
        actions = action_store.get_actions(user_id)
    return {'user_id': user_id, 'actions': actions}


@router.post('/execute')
async def execute(payload: dict, _ok: bool = Depends(verify_api_key)):
    """Execute a suggestion if policy allows. Payload: {user_id, suggestion: {...}, mode: 'auto'|'manual'}"""
    user_id = payload.get('user_id')
    suggestion = payload.get('suggestion') or {}
    mode = payload.get('mode', 'auto')
    if not user_id:
        raise HTTPException(status_code=400, detail='user_id required')
    result = executor.execute_action(user_id, suggestion, mode=mode)
    return result
