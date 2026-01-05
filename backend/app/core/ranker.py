from typing import List, Dict
from datetime import datetime
from .actions import action_store
from .learning import load_weights
from . import store as core_store

SEVERITY_WEIGHT = {'low': 1, 'medium': 2, 'high': 3}


def _parse_evidence_time(evidence_item: str):
    # evidence format: "{iso} | {type} | {event_id}"
    try:
        ts = evidence_item.split('|', 1)[0].strip()
        return datetime.fromisoformat(ts)
    except Exception:
        return None


def _user_accept_rate_for_suggestion(user_id: str, suggestion_id: str) -> float:
    """Get user accept rate for a specific suggestion.

    We consult BOTH the persistent store (if it supports action history)
    and the in-memory `action_store`. This makes the ranker:
      - Work in production with SQLite-backed history.
      - Still honour test-only / ephemeral history recorded via `action_store`
        (several unit tests rely on this behaviour).
    """
    actions = []

    # 1) Persistent store (e.g. SqliteStore) if it exposes get_actions
    persistent = getattr(core_store, 'store', None)
    if persistent is not None and hasattr(persistent, 'get_actions'):
        try:
            actions.extend(persistent.get_actions(user_id) or [])
        except Exception:
            # Best-effort only – fall back to in-memory history below.
            pass

    # 2) In-memory store (always available for fast tests)
    try:
        actions.extend(action_store.get_actions(user_id) or [])
    except Exception:
        pass

    if not actions:
        return 0.0
    # look for actions specific to this suggestion
    same = [a for a in actions if a.get('suggestion_id') == suggestion_id]
    if same:
        accepts = sum(1 for a in same if a.get('action') == 'accept')
        return accepts / float(len(same))
    # fallback: do not apply user's overall accept rate to unrelated suggestions
    # returning 0.0 for suggestions with no direct history makes the ranker
    # prefer suggestions the user actually accepted previously.
    return 0.0


def rank_suggestions(suggestions: List[Dict], user_id: str) -> List[Dict]:
    """Re-rank suggestions using simple feature-based linear scorer.

    Features:
    - severity (mapped)
    - recency (more recent -> higher)
    - evidence_count (more evidence -> higher)
    - user_accept_rate (if historic actions)
    """
    now = datetime.utcnow()
    # load persisted weights (if any)
    weights = load_weights()
    global_accept = weights.get('global_accept_rate', 0.0)
    per_title_weights = weights.get('per_title', {})

    scored = []
    for s in suggestions:
        severity = s.get('severity', 'low')
        sev_val = SEVERITY_WEIGHT.get(severity, 1)
        evidence = s.get('evidence') or []
        ev_count = len(evidence)
        # recency: use latest evidence timestamp if available
        recency_score = 0.0
        if ev_count:
            times = [_parse_evidence_time(e) for e in evidence]
            times = [t for t in times if t]
            if times:
                latest = max(times)
                secs = (now - latest).total_seconds()
                # convert to score in (0,1], recent -> closer to 1
                recency_score = 1.0 / (1.0 + secs / 60.0)
        # evidence score normalized to [0,1] with cap at 5
        evidence_score = min(1.0, ev_count / 5.0)
        # user accept rate
        accept_rate = 0.0
        try:
            accept_rate = _user_accept_rate_for_suggestion(user_id, s.get('id'))
        except Exception:
            accept_rate = 0.0
        # linear combination weights (tunable)
        # reduce absolute dominance of severity, increase recency and accept-rate influence
        W_SEV = 0.3
        W_RECENCY = 0.4
        W_EVIDENCE = 0.15
        W_ACCEPT = 0.15
        final = (sev_val * W_SEV) + (recency_score * W_RECENCY) + (evidence_score * W_EVIDENCE) + (accept_rate * W_ACCEPT)
        # apply learned weight adjustments: bias by global accept rate and per-suggestion weight
        try:
            # prefer title-based learned weights if present
            title = s.get('title')
            per_w = per_title_weights.get(title) if per_title_weights and title else None
            if per_w is not None:
                # amplify score if this suggestion title historically accepted
                final = final * (1.0 + float(per_w) * 0.5)
            else:
                final = final * (1.0 + float(global_accept) * 0.2)
        except Exception:
            pass
        s['_rank_score'] = final
        scored.append(s)
    scored.sort(key=lambda x: x.get('_rank_score', 0), reverse=True)
    return scored
