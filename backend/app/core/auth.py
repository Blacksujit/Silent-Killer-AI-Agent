from fastapi import Header, HTTPException
import os
from typing import Optional


def verify_api_key(x_api_key: Optional[str] = Header(None)):
    """Simple API key verifier.

    Behavior:
    - If environment variable `SILENT_KILLER_API_KEYS` is not set, authentication is disabled (returns True).
    - If set, expects a comma-separated list of valid keys. The request must include header `x-api-key: <key>`.
    """
    keys = os.environ.get('SILENT_KILLER_API_KEYS')
    if not keys:
        return True
    valid = [k.strip() for k in keys.split(',') if k.strip()]
    if not x_api_key or x_api_key not in valid:
        raise HTTPException(status_code=401, detail='Unauthorized')
    return True
