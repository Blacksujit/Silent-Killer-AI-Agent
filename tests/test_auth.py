import os
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_endpoints_require_api_key_when_configured(monkeypatch):
    # configure a single valid API key
    monkeypatch.setenv('SILENT_KILLER_API_KEYS', 'testkey123')

    # ingest without header -> 401
    r = client.post('/api/ingest', json={'user_id':'u','timestamp':'2026-01-01T00:00:00','type':'idle'})
    assert r.status_code == 401

    # with header (send as list to match API union[Event, List[Event]) parsing)
    r2 = client.post('/api/ingest', json=[{'user_id':'u','timestamp':'2026-01-01T00:00:00','type':'idle'}], headers={'x-api-key':'testkey123'})
    assert r2.status_code in (200,201)

    # suggestions without header -> 401
    r3 = client.get('/api/suggestions?user_id=u')
    assert r3.status_code == 401

    r4 = client.get('/api/suggestions?user_id=u', headers={'x-api-key':'testkey123'})
    assert r4.status_code == 200

    # execute endpoint
    payload = {'user_id':'u','suggestion':{'id':'s','title':'t','confidence':0.1}, 'mode':'auto'}
    r5 = client.post('/api/execute', json=payload)
    assert r5.status_code == 401
    r6 = client.post('/api/execute', json=payload, headers={'x-api-key':'testkey123'})
    assert r6.status_code == 200
