from backend.app.core.learning import train_and_persist, load_weights
from backend.app.core.sql_store import SqliteStore
from datetime import datetime
import tempfile
import os


def test_train_and_persist():
    tf = tempfile.NamedTemporaryFile(delete=False)
    tf.close()
    db_path = tf.name
    try:
        s = SqliteStore(db_path=db_path)
        # add actions
        a1 = {'user_id': 'u1', 'suggestion_id': 's1', 'action': 'accept', 'details': None, 'timestamp': datetime.utcnow()}
        a2 = {'user_id': 'u1', 'suggestion_id': 's1', 'action': 'reject', 'details': None, 'timestamp': datetime.utcnow()}
        a3 = {'user_id': 'u1', 'suggestion_id': 's2', 'action': 'accept', 'details': None, 'timestamp': datetime.utcnow()}
        s.add_action('u1', a1)
        s.add_action('u1', a2)
        s.add_action('u1', a3)
        # monkeypatch core.store.store to sqlite store for training
        from backend.app.core import store as core_store_module
        core_store_module.store = s
        weights = train_and_persist()
        assert 'global_accept_rate' in weights
        assert 'per_title' in weights
    finally:
        try:
            os.unlink(db_path)
        except Exception:
            pass
