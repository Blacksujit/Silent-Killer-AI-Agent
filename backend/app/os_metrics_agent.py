"""Minimal OS metrics agent for SILENT KILLER.

Run this alongside the backend to send real CPU/memory/network metrics
into the existing /api/ingest pipeline as `system_metrics` events.

Configure via environment variables:

- SILENT_KILLER_BACKEND_URL: base URL of the backend (default: http://localhost:8000)
- SILENT_KILLER_USER_ID: user_id to tag metrics with (should match the userId
  you see in the web Settings panel).
- SILENT_KILLER_METRICS_INTERVAL: seconds between samples (default: 5).
"""

import os
import time
import uuid
from datetime import datetime

import psutil  # type: ignore
import requests  # type: ignore


BACKEND_URL = os.environ.get("SILENT_KILLER_BACKEND_URL", "http://localhost:8000").rstrip("/")
INGEST_URL = f"{BACKEND_URL}/api/ingest"
USER_ID = os.environ.get("SILENT_KILLER_USER_ID", "os-metrics-demo-user")
INTERVAL = float(os.environ.get("SILENT_KILLER_METRICS_INTERVAL", "5"))


def make_event(meta: dict) -> dict:
  """Build a system_metrics event compatible with the existing ingest API."""
  return {
    "user_id": USER_ID,
    "event_id": str(uuid.uuid4()),
    "timestamp": datetime.utcnow().isoformat(),
    "type": "system_metrics",
    "meta": meta,
  }


def main() -> None:
  print(f"[os_metrics_agent] Sending system_metrics for user_id={USER_ID} to {INGEST_URL} every {INTERVAL}s")

  prev_bytes_sent = None
  prev_bytes_recv = None
  prev_ts = None

  while True:
    ts_now = time.time()

    # CPU and memory percentages from psutil
    cpu = psutil.cpu_percent(interval=0.5)
    mem = psutil.virtual_memory().percent

    # Simple network load score based on bytes/sec
    net = psutil.net_io_counters()
    if prev_bytes_sent is not None and prev_bytes_recv is not None and prev_ts is not None:
      dt = max(1e-3, ts_now - prev_ts)
      bytes_delta = (net.bytes_sent - prev_bytes_sent) + (net.bytes_recv - prev_bytes_recv)
      bytes_per_sec = bytes_delta / dt
      # Map to a 0-100 score (tunable heuristic)
      network_load = min(100.0, bytes_per_sec / 50000.0)
    else:
      network_load = 0.0

    prev_bytes_sent = net.bytes_sent
    prev_bytes_recv = net.bytes_recv
    prev_ts = ts_now

    # Event.meta is defined as Dict[str, str] in the backend models,
    # so we stringify all metric values here to avoid 422 errors.
    event = make_event({
      "cpu": f"{float(cpu):.2f}",
      "memory": f"{float(mem):.2f}",
      "network": f"{float(network_load):.4f}",
    })

    try:
      resp = requests.post(INGEST_URL, json=event, timeout=5)
      if resp.status_code >= 400:
        print(f"[os_metrics_agent] POST failed: {resp.status_code} {resp.text}")
    except Exception as e:  # pragma: no cover - best-effort reporting
      print(f"[os_metrics_agent] Error posting metrics: {e}")

    time.sleep(INTERVAL)


if __name__ == "__main__":
  main()
