from datetime import datetime, timedelta
import os
import tempfile
import json

from backend.app.core.normalizer import normalize_event, _hash_text
from backend.app.core.sql_store import SqliteStore


def test_normalizer_hashes_pii(monkeypatch):
    # ensure deterministic behavior by setting salt
    monkeypatch.setenv('SILENT_KILLER_PII_SALT', 'testsalt')
    raw = {
        'user_id': 'u1',
        'event_id': 'e1',
        'timestamp': datetime.utcnow().isoformat(),
        'type': 'test',
        'meta': {
            'email': 'user@example.com',
            'username': 'tester',
            'window_title': 'Super Secret Window Title That Should Be Hashed'
        }
    }
    norm = normalize_event(raw)
    meta = norm['meta']
    # original PII keys removed
    assert 'email' not in meta
    assert 'username' not in meta
    # hash keys present
    assert 'email_hash' in meta and meta['email_hash']
    assert 'username_hash' in meta and meta['username_hash']
    # window_title should be replaced with window_title_hash
    assert 'window_title' not in meta
    assert 'window_title_hash' in meta


def test_sqlite_prune_actions(tmp_path):
    db_file = tmp_path / 'test_store.db'
    # retention 1 day
    s = SqliteStore(db_path=str(db_file), retention_days=1)
    # insert an action with old timestamp
    old_ts = (datetime.utcnow() - timedelta(days=5)).isoformat()
    action = {
        'timestamp': old_ts,
        'suggestion_id': 's1',
        'suggestion_title': 't',
        'suggestion_severity': 'low',
        'action': 'accepted',
        'details': 'old'
    }
    s.add_action('u1', action)
    actions_before = s.get_actions('u1')
    assert len(actions_before) == 1
    s.prune()
    actions_after = s.get_actions('u1')
    # old action should have been pruned
    assert len(actions_after) == 0
