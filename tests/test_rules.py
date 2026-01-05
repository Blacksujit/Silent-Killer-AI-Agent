import pytest
from datetime import datetime, timedelta
from backend.app.core.rules import high_context_switch_rule


def make_event(ts, etype):
    return {'event_id': str(ts.timestamp()), 'timestamp': ts, 'type': etype}


def test_high_context_switch():
    now = datetime.utcnow()
    events = []
    # create 15 window_focus events in the last 10 minutes
    for i in range(15):
        events.append(make_event(now - timedelta(minutes=1, seconds=i), 'window_focus'))
    res = high_context_switch_rule(events, window_minutes=10, threshold=12)
    assert isinstance(res, list)
    assert len(res) == 1
    s = res[0]
    assert 'High context switching' in s['title'] or 'context' in s['title']
