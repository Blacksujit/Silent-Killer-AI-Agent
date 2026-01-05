import json
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

from . import store as core_store
from .actions import action_store

WEIGHTS_PATH = Path(__file__).resolve().parent.parent / 'data' / 'weights.json'


def _ensure_dir():
    WEIGHTS_PATH.parent.mkdir(parents=True, exist_ok=True)


def _get_action_provider():
    """Return an object with get_actions(user_id) method.
    Prefer core_store if it exposes get_actions (sqlite backend), else fall back to action_store.
    """
    s = core_store.store
    if hasattr(s, 'get_actions'):
        return s
    return action_store


def compute_acceptance_metrics(user_id: Optional[str] = None) -> Dict[str, Any]:
    """Compute acceptance metrics across stored actions.
    Returns a dict: { 'total': int, 'accepts': int, 'accept_rate': float, 'per_suggestion': {sugg_id: {count, accepts, rate}} }
    If user_id provided, limit to that user's actions.
    """
    provider = _get_action_provider()
    # if user_id provided, just fetch that user's actions
    if user_id:
        actions = provider.get_actions(user_id)
    else:
        # need to aggregate across all users - try to fetch all by reading action_store internals if possible
        # action_store may not support listing all users; fall back to empty
        actions = []
        if hasattr(provider, '_store'):
            # in-memory action_store
            for u, lst in provider._store.items():
                actions.extend(lst)
    total = len(actions)
    accepts = sum(1 for a in actions if a.get('action') == 'accept')
    per = {}
    for a in actions:
        # prefer suggestion_title for aggregation; fallback to suggestion_id
        sid = a.get('suggestion_title') or a.get('suggestion_id') or 'unknown'
        ent = per.setdefault(sid, {'count': 0, 'accepts': 0})
        ent['count'] += 1
        if a.get('action') == 'accept':
            ent['accepts'] += 1
    for sid, v in per.items():
        v['rate'] = v['accepts'] / v['count'] if v['count'] else 0.0
    accept_rate = accepts / total if total else 0.0
    return {'total': total, 'accepts': accepts, 'accept_rate': accept_rate, 'per_suggestion': per}


def load_weights() -> Dict[str, Any]:
    if WEIGHTS_PATH.exists():
        try:
            return json.loads(WEIGHTS_PATH.read_text())
        except Exception:
            return {}
    return {}


def persist_weights(weights: Dict[str, Any]):
    _ensure_dir()
    WEIGHTS_PATH.write_text(json.dumps(weights, indent=2))


def train_and_persist(user_id: Optional[str] = None) -> Dict[str, Any]:
    """Simple trainer: computes acceptance metrics and persists a tiny weights dict.
    Currently stores global_accept_rate and per_suggestion acceptance rates.
    """
    metrics = compute_acceptance_metrics(user_id)
    weights = {'trained_at': datetime.utcnow().isoformat(), 'global_accept_rate': metrics.get('accept_rate', 0.0), 'per_title': {}}
    for sid, v in metrics.get('per_suggestion', {}).items():
        weights['per_title'][sid] = v.get('rate', 0.0)
    persist_weights(weights)
    return weights
