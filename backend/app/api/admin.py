from fastapi import APIRouter, HTTPException, Depends
from ..core import store as core_store_module
from ..core.auth import verify_api_key

router = APIRouter()


@router.post('/prune')
async def prune_store(_ok: bool = Depends(verify_api_key)):
    """Trigger immediate pruning of old events according to retention policy."""
    s = core_store_module.store
    if not hasattr(s, 'prune'):
        raise HTTPException(status_code=400, detail='store does not support prune')
    try:
        s.prune()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {'status': 'ok', 'pruned': True}
