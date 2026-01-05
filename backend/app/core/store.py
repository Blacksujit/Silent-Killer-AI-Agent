from os import environ
from .sql_store import SqliteStore
from collections import defaultdict
from threading import Lock
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import uuid


class InMemoryStore:
    def __init__(self, retention_days: int = 30):
        self._store: Dict[str, List[Dict]] = defaultdict(list)  # user_id -> list of events
        self._lock = Lock()
        self.retention = timedelta(days=retention_days)

    def add_event(self, user_id: str, event: Dict):
        # normalize timestamp: if string, try parse
        if isinstance(event.get('timestamp'), str):
            try:
                event['timestamp'] = datetime.fromisoformat(event['timestamp'])
            except Exception:
                # leave as-is; may error later
                pass
        # ensure event_id exists
        if not event.get('event_id'):
            event['event_id'] = str(uuid.uuid4())

        # dedupe by event_id: skip if same id already stored for user
        with self._lock:
            existing_ids = {e.get('event_id') for e in self._store.get(user_id, [])}
            if event.get('event_id') in existing_ids:
                return
        with self._lock:
            self._store[user_id].append(event)

    def get_events(self, user_id: str, since: Optional[datetime] = None):
        with self._lock:
            events = list(self._store.get(user_id, []))
        if since:
            return [e for e in events if e.get('timestamp') and e['timestamp'] >= since]
        return events

    def prune(self):
        cutoff = datetime.utcnow() - self.retention
        with self._lock:
            for u, events in list(self._store.items()):
                self._store[u] = [e for e in events if e.get('timestamp') and e['timestamp'] >= cutoff]


# factory: choose backend based on environment
def _create_default_store():
    mode = environ.get('SILENT_KILLER_STORE', 'memory').lower()
    if mode == 'sqlite':
        # optional path and retention can be configured via env vars later
        db_path = environ.get('SILENT_KILLER_SQLITE_PATH')
        retention = int(environ.get('SILENT_KILLER_RETENTION_DAYS', '30'))
        return SqliteStore(db_path=db_path, retention_days=retention)
    return InMemoryStore()


# singleton store
store = _create_default_store()
