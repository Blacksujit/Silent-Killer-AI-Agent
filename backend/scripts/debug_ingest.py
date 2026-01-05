from fastapi.testclient import TestClient
from backend.app.main import app
client = TestClient(app)
import os
os.environ['SILENT_KILLER_API_KEYS']='testkey123'
# Try posting list
r = client.post('/api/ingest', json=[{'user_id':'u','timestamp':'2026-01-01T00:00:00','type':'idle'}], headers={'x-api-key':'testkey123'})
print('status', r.status_code)
print('body', r.text)
