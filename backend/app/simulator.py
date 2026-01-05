"""Simple event simulator to POST to the ingest API. Run as a script for demos."""
import requests
import uuid
import random
from datetime import datetime, timedelta
import time


def make_event(user_id, t, etype, meta=None):
    return {
        'user_id': user_id,
        'event_id': str(uuid.uuid4()),
        'timestamp': t.isoformat(),
        'type': etype,
        'meta': meta or {}
    }


def emit(url, user_id, preset='focus-heavy', rate=1.0, duration=10):
    t = datetime.utcnow()
    end = t + timedelta(seconds=duration)
    etypes_map = {
        'focus-heavy': ['window_focus'] * 8 + ['file_open'],
        'interruptions': ['window_focus', 'notification', 'idle', 'window_focus', 'notification'],
        'repeated-seq': ['file_open', 'command_run', 'file_save']
    }
    etypes = etypes_map.get(preset, ['window_focus', 'file_open'])
    while datetime.utcnow() < end:
        etype = random.choice(etypes)
        ev = make_event(user_id, datetime.utcnow(), etype, {"app": "demo"})
        try:
            requests.post(url, json=ev)
        except Exception as e:
            print('post error', e)
        time.sleep(1.0 / rate)


if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--url', default='http://localhost:8000/api/ingest')
    p.add_argument('--user', default='test-user')
    p.add_argument('--preset', default='focus-heavy')
    p.add_argument('--rate', type=float, default=1.0)
    p.add_argument('--duration', type=int, default=10)
    args = p.parse_args()
    emit(args.url, args.user, preset=args.preset, rate=args.rate, duration=args.duration)
