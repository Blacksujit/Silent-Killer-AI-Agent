from fastapi.testclient import TestClient
from backend.app.main import app
from datetime import datetime, timedelta

client = TestClient(app)


def test_ingest_and_suggestions_flow():
    user_id = 'test-user'
    now = datetime.utcnow()
    events = []
    # create multiple window_focus events to trigger high_context_switch_rule
    for i in range(13):
        ev = {
            'user_id': user_id,
            'event_id': f'evt-{i}',
            'timestamp': (now - timedelta(minutes=1, seconds=i)).isoformat(),
            'type': 'window_focus',
            'meta': {}
        }
        events.append(ev)

    # POST events
    r = client.post('/api/ingest', json=events)
    assert r.status_code == 200 or r.status_code == 201
    body = r.json()
    assert body.get('status') == 'accepted'

    # GET suggestions
    r2 = client.get(f'/api/suggestions?user_id={user_id}')
    assert r2.status_code == 200
    data = r2.json()
    assert 'suggestions' in data
    assert isinstance(data['suggestions'], list)
    # Expect at least one suggestion
    assert len(data['suggestions']) >= 1
