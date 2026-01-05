from typing import Dict, Any
import os
from datetime import datetime

from . import store as core_store_module
from .actions import action_store

# Configurable threshold for auto-execution
AUTO_EXECUTE_CONFIDENCE = float(os.environ.get('SILENT_KILLER_AUTO_EXEC_CONF', '0.9'))


def _get_action_persistence():
    s = core_store_module.store
    if hasattr(s, 'add_action'):
        return s
    return action_store


def execute_action(user_id: str, suggestion: Dict[str, Any], mode: str = 'auto') -> Dict[str, Any]:
    """
    Execute or schedule execution of a suggested action.
    - suggestion: dict expected to contain id, title, suggested_action, confidence
    - mode: 'auto' to allow automatic execution, 'manual' to require user confirmation

    The function will perform policy checks and record an action in action history if executed.
    It does NOT run actual system commands; it only simulates execution and records the audit trail.
    """
    provider = _get_action_persistence()
    confidence = float(suggestion.get('confidence', 0.0))
    suggestion_id = suggestion.get('id')
    title = suggestion.get('title') or suggestion.get('suggestion_title')
    severity = suggestion.get('severity') or suggestion.get('suggestion_severity')
    suggested_action = suggestion.get('suggested_action')

    # Decide execution
    executed = False
    reason = None
    if mode == 'auto':
        if confidence >= AUTO_EXECUTE_CONFIDENCE:
            executed = True
        else:
            executed = False
            reason = f"confidence {confidence} below auto-exec threshold {AUTO_EXECUTE_CONFIDENCE}"
    else:
        # manual or other modes require explicit user approval; we treat as executed=false
        executed = False
        reason = 'manual mode: requires user approval'

    # Record action if executed (or optionally record attempts)
    action_record = {
        'user_id': user_id,
        'suggestion_id': suggestion_id,
        'suggestion_title': title,
        'suggestion_severity': severity,
        'action': 'auto_execute' if executed else 'suggested',
        'details': reason,
        'timestamp': datetime.utcnow()
    }

    try:
        provider.add_action(user_id, action_record)
    except Exception:
        # best-effort: ignore persistence failures but surface in response
        return {'status': 'error', 'reason': 'persistence_failed', 'executed': executed}

    return {'status': 'ok', 'executed': executed, 'reason': reason, 'record': action_record}
