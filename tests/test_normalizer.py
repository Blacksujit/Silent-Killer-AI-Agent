from backend.app.core.normalizer import normalize_event
from datetime import datetime


def test_normalize_hashes_title():
    raw = {
        'user_id': 'u1',
        'event_id': 'e1',
        'timestamp': datetime.utcnow().isoformat(),
        'type': 'window_focus',
        'meta': {'window_title': 'My Secret Title That Is Long'}
    }
    out = normalize_event(raw)
    assert 'window_title_hash' in out['meta']
    assert 'window_title' not in out['meta']
    assert isinstance(out['timestamp'], datetime)
