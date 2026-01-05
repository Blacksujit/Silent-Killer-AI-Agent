from fastapi.testclient import TestClient
from backend.app.main import app
from datetime import datetime, timedelta
import uuid

client = TestClient(app)

user_id = 'smoke-user'
now = datetime.utcnow()

# Build a list of window_focus events designed to trigger high_context_switch_rule
events = []
for i in range(13):
    ev = {
        'user_id': user_id,
        'event_id': f'smoke-evt-{i}',
        'timestamp': (now - timedelta(seconds=i)).isoformat(),
        'type': 'window_focus',
        'meta': {'app': 'smoke'}
    }
    events.append(ev)

print('Posting', len(events), 'events')
r = client.post('/api/ingest', json=events)
print('POST status', r.status_code, r.json())

r2 = client.get(f'/api/suggestions?user_id={user_id}')
print('GET status', r2.status_code)
print('Suggestions:', r2.json())
