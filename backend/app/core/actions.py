from threading import Lock
from typing import Dict, List
from datetime import datetime

class ActionStore:
    def __init__(self):
        self._store: Dict[str, List[dict]] = {}
        self._lock = Lock()

    def add_action(self, user_id: str, action: dict):
        with self._lock:
            self._store.setdefault(user_id, []).append(action)

    def get_actions(self, user_id: str):
        with self._lock:
            return list(self._store.get(user_id, []))


# singleton
action_store = ActionStore()
