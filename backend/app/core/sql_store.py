import sqlite3
import json
from threading import Lock
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from pathlib import Path


class SqliteStore:
    def __init__(self, db_path: str = None, retention_days: int = 30):
        if db_path is None:
            db_path = str(Path(__file__).resolve().parent.parent.parent / 'data' / 'store.db')
        self.db_path = db_path
        self._lock = Lock()
        self.retention = timedelta(days=retention_days)
        self._ensure_db()

    def _ensure_db(self):
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.db_path) as conn:
            c = conn.cursor()
            c.execute(
                '''
                CREATE TABLE IF NOT EXISTS events (
                    event_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    type TEXT,
                    meta TEXT
                )
                '''
            )
            c.execute(
                '''
                CREATE INDEX IF NOT EXISTS idx_events_user_ts ON events(user_id, timestamp)
                '''
            )
            c.execute(
                '''
                CREATE TABLE IF NOT EXISTS actions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    suggestion_id TEXT,
                    suggestion_title TEXT,
                    suggestion_severity TEXT,
                    action TEXT,
                    details TEXT,
                    timestamp TEXT
                )
                '''
            )
            conn.commit()

    def add_event(self, user_id: str, event: Dict):
        # expect event to have event_id and timestamp (datetime or iso)
        eid = event.get('event_id')
        ts = event.get('timestamp')
        if hasattr(ts, 'isoformat'):
            ts = ts.isoformat()
        etype = event.get('type')
        meta = json.dumps(event.get('meta', {}))
        with self._lock:
            with sqlite3.connect(self.db_path) as conn:
                c = conn.cursor()
                try:
                    c.execute(
                        'INSERT INTO events(event_id, user_id, timestamp, type, meta) VALUES (?, ?, ?, ?, ?)',
                        (eid, user_id, ts, etype, meta),
                    )
                except sqlite3.IntegrityError:
                    # duplicate event_id -> ignore
                    return
                conn.commit()

    def get_events(self, user_id: str, since: Optional[datetime] = None) -> List[Dict]:
        with self._lock:
            with sqlite3.connect(self.db_path) as conn:
                c = conn.cursor()
                if since:
                    since_s = since.isoformat()
                    c.execute('SELECT event_id, user_id, timestamp, type, meta FROM events WHERE user_id = ? AND timestamp >= ? ORDER BY timestamp', (user_id, since_s))
                else:
                    c.execute('SELECT event_id, user_id, timestamp, type, meta FROM events WHERE user_id = ? ORDER BY timestamp', (user_id,))
                rows = c.fetchall()
        out = []
        for r in rows:
            eid, uid, ts_s, etype, meta_s = r
            try:
                ts = datetime.fromisoformat(ts_s)
            except Exception:
                ts = datetime.utcnow()
            try:
                meta = json.loads(meta_s) if meta_s else {}
            except Exception:
                meta = {}
            out.append({'event_id': eid, 'user_id': uid, 'timestamp': ts, 'type': etype, 'meta': meta})
        return out

    def prune(self):
        cutoff = (datetime.utcnow() - self.retention).isoformat()
        with self._lock:
            with sqlite3.connect(self.db_path) as conn:
                c = conn.cursor()
                c.execute('DELETE FROM events WHERE timestamp < ?', (cutoff,))
                # also prune old action audit records to respect retention
                try:
                    c.execute('DELETE FROM actions WHERE timestamp < ?', (cutoff,))
                except Exception:
                    # if actions lack timestamps or schema differs, ignore
                    pass
                conn.commit()

    # action history
    def add_action(self, user_id: str, action: Dict):
        ts = action.get('timestamp')
        if hasattr(ts, 'isoformat'):
            ts = ts.isoformat()
        suggestion_id = action.get('suggestion_id')
        suggestion_title = action.get('suggestion_title')
        suggestion_severity = action.get('suggestion_severity')
        act = action.get('action')
        details = action.get('details')
        with self._lock:
            with sqlite3.connect(self.db_path) as conn:
                c = conn.cursor()
                c.execute('INSERT INTO actions(user_id, suggestion_id, suggestion_title, suggestion_severity, action, details, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)', (user_id, suggestion_id, suggestion_title, suggestion_severity, act, details, ts))
                conn.commit()

    def get_actions(self, user_id: str) -> List[Dict]:
        with self._lock:
            with sqlite3.connect(self.db_path) as conn:
                c = conn.cursor()
                c.execute('SELECT id, user_id, suggestion_id, suggestion_title, suggestion_severity, action, details, timestamp FROM actions WHERE user_id = ? ORDER BY id', (user_id,))
                rows = c.fetchall()
        out = []
        for r in rows:
            _id, uid, suggestion_id, suggestion_title, suggestion_severity, act, details, ts_s = r
            try:
                ts = datetime.fromisoformat(ts_s) if ts_s else None
            except Exception:
                ts = None
            out.append({'id': _id, 'user_id': uid, 'suggestion_id': suggestion_id, 'suggestion_title': suggestion_title, 'suggestion_severity': suggestion_severity, 'action': act, 'details': details, 'timestamp': ts})
        return out
