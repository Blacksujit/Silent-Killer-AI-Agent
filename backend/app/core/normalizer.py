from datetime import datetime
from typing import Dict, Any
import hashlib
import hmac
import os

# Settings for data minimization
HASH_WINDOW_TITLE = True
MAX_TITLE_LEN = 100

# PII keys in event.meta to anonymize/hash
PII_KEYS = ('email', 'user_email', 'username', 'name', 'full_name')


def _hash_text(text: str, key: str | None = None) -> str:
    """Return a hex digest. If key provided, use HMAC for deterministic keyed hashing.

    Using a keyed HMAC is recommended in production so hashes cannot be reversed
    if the DB is leaked without the key.
    """
    if key:
        return hmac.new(key.encode('utf-8'), text.encode('utf-8'), hashlib.sha256).hexdigest()
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def normalize_event(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize incoming event dict into canonical schema.

    - ensures timestamp is a datetime
    - trims large strings and hashes window titles if needed
    - returns a new dict with keys: user_id, event_id, timestamp (datetime), type, meta
    """
    ev = {}
    ev['user_id'] = raw.get('user_id')
    ev['event_id'] = raw.get('event_id')

    ts = raw.get('timestamp')
    if isinstance(ts, str):
        try:
            ev['timestamp'] = datetime.fromisoformat(ts)
        except Exception:
            # fallback: current time
            ev['timestamp'] = datetime.utcnow()
    elif isinstance(ts, datetime):
        ev['timestamp'] = ts
    else:
        ev['timestamp'] = datetime.utcnow()

    ev['type'] = raw.get('type')

    meta = dict(raw.get('meta', {}) or {})
    # get salt from env for keyed hashing; fall back to None (still hashes but unkeyed)
    pii_salt = os.environ.get('SILENT_KILLER_PII_SALT')
    # anonymize common PII keys by replacing them with a hashed value
    for k in PII_KEYS:
        if k in meta and meta.get(k):
            v = str(meta.get(k))
            try:
                meta[f'{k}_hash'] = _hash_text(v, pii_salt)
            except Exception:
                meta[f'{k}_hash'] = _hash_text(v, None)
            # remove original sensitive field
            meta.pop(k, None)
    # data minimization: window_title handling
    if 'window_title' in meta:
        title = meta.get('window_title') or ''
        if HASH_WINDOW_TITLE and title:
            meta['window_title_hash'] = _hash_text(title[:MAX_TITLE_LEN])
            # remove original
            meta.pop('window_title', None)
        else:
            meta['window_title'] = (title[:MAX_TITLE_LEN])
    # truncate any long text fields
    for k, v in list(meta.items()):
        if isinstance(v, str) and len(v) > 1000:
            meta[k] = v[:1000]

    ev['meta'] = meta
    return ev
