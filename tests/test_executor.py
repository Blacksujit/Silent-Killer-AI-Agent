from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.sql_store import SqliteStore
from backend.app.core import store as core_store_module
from datetime import datetime
import tempfile
import os

client = TestClient(app)


def test_auto_execute_allowed():
    tf = tempfile.NamedTemporaryFile(delete=False)
    tf.close()
    db_path = tf.name
    try:
        s = SqliteStore(db_path=db_path)
        # monkeypatch store
        core_store_module.store = s
        suggestion = {'id': 's1', 'title': 'Auto Action', 'confidence': 0.95, 'suggested_action': 'do_something'}
        payload = {'user_id': 'u1', 'suggestion': suggestion, 'mode': 'auto'}
        r = client.post('/api/execute', json=payload)
        assert r.status_code == 200
        body = r.json()
        assert body.get('executed') is True
        # persisted action
        acts = s.get_actions('u1')
        assert any(a['action'] == 'auto_execute' for a in acts)
    finally:
        try:
            os.unlink(db_path)
        except Exception:
            pass


def test_auto_execute_denied():
    tf = tempfile.NamedTemporaryFile(delete=False)
    tf.close()
    db_path = tf.name
    try:
        s = SqliteStore(db_path=db_path)
        core_store_module.store = s
        suggestion = {'id': 's2', 'title': 'Low Conf Action', 'confidence': 0.1, 'suggested_action': 'do_something_else'}
        payload = {'user_id': 'u2', 'suggestion': suggestion, 'mode': 'auto'}
        r = client.post('/api/execute', json=payload)
        assert r.status_code == 200
        body = r.json()
        assert body.get('executed') is False
        # ensure recorded as suggested (not executed)
        acts = s.get_actions('u2')
        assert any(a['action'] == 'suggested' for a in acts)
    finally:
        try:
            os.unlink(db_path)
        except Exception:
            pass
