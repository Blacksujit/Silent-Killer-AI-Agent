from backend.app.core.sql_store import SqliteStore
from datetime import datetime, timedelta
import tempfile
import os


def test_sqlite_store_add_and_get():
    tf = tempfile.NamedTemporaryFile(delete=False)
    tf.close()
    db_path = tf.name
    try:
        s = SqliteStore(db_path=db_path, retention_days=1)
        now = datetime.utcnow()
        ev = {'event_id': 'evt-1', 'timestamp': now, 'type': 'window_focus', 'meta': {}}
        s.add_event('u1', ev)
        got = s.get_events('u1')
        assert len(got) == 1
        assert got[0]['event_id'] == 'evt-1'
        # test dedupe
        s.add_event('u1', ev)
        got = s.get_events('u1')
        assert len(got) == 1
        # test since filter
        past = now - timedelta(days=2)
        old = {'event_id': 'evt-old', 'timestamp': past, 'type': 'idle', 'meta': {}}
        s.add_event('u1', old)
        got_all = s.get_events('u1')
        assert any(e['event_id'] == 'evt-old' for e in got_all)
        got_recent = s.get_events('u1', since=now - timedelta(minutes=1))
        assert all(e['timestamp'] >= (now - timedelta(minutes=1)) for e in got_recent)
    finally:
        try:
            os.unlink(db_path)
        except PermissionError:
            # On Windows the file may still be locked briefly; ignore for tests
            pass
