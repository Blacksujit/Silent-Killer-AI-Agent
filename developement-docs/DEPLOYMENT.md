# 🚀 SILENT KILLER Deployment Guide

## Local Test Checklist (do this before deploying)

### 1) Backend
```bash
# From repo root
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Verify:
- `curl http://localhost:8000/api/health` → `{"status":"ok"}`
- `curl http://localhost:8000/api/stats?user_id=default_user` → `{event_count:..., last_event_ts:...}`

### 2) Frontend
```bash
# From repo root
cd frontend
npm run dev
```
Open http://localhost:3000
- Navigate to **Monitor → Start Monitoring**
- Then go to **Dashboard**
- You should see: **“Backend stats updated Xs ago”** and rising event count

### 3) Agent / TUI (local)
```bash
# From repo root
cd agent
python main.py --api-url http://localhost:8000 status
python main.py --api-url http://localhost:8000 simulate --duration 30 --events 10
python tui.py  # interactive TUI (will use http://localhost:8000 by default)
```

---

## Render Deployment (Public MVP)

### Option A: Render Blueprint via `render.yaml` (recommended)
1. Push repo to GitHub
2. Render → **New → Blueprint**
3. Select repo
4. Render will read `render.yaml` and create a single Web Service
5. After deploy:
   - App URL: `https://<your-service>.onrender.com`
   - Health: `https://<your-service>.onrender.com/api/health`
   - Stats: `https://<your-service>.onrender.com/api/stats?user_id=default_user`

### Option B: Manual Web Service
1. Render → **New → Web Service**
2. Connect repo
3. **Docker Context**: Root (`/`)
4. **Dockerfile Path**: `./Dockerfile`
5. **Add Environment Variables** (see below)
6. Deploy

---

## Render Environment Variables (public MVP)

| Variable | Value | Notes |
|----------|--------|-------|
| `SILENT_KILLER_STORE` | `sqlite` | SQLite persistence |
| `SILENT_KILLER_SQLITE_PATH` | `/var/data/store.db` | Path in container |
| `SILENT_KILLER_RETENTION_DAYS` | `30` | Data retention |
| `SILENT_KILLER_PRUNE_INTERVAL_SECONDS` | `3600` | Background prune |
| `SILENT_KILLER_PII_SALT` | **Generate** | Privacy salt |
| `SILENT_KILLER_AUTO_EXEC_CONF` | `0.9` | Auto-execution confidence |
| `LOG_LEVEL` | `INFO` | Logging level |

> **Important**: `SILENT_KILLER_API_KEYS` is **not set** for public MVP (browsers can’t keep secrets). You can enable it later for private deployments or server-to-server clients.

---

## Persistent Data (optional but recommended)

By default, SQLite lives inside the container and resets on each deploy. To persist data:
1. Render → **Services → [your service]**
2. **Add Disk**
   - Path: `/var/data`
   - Size: `1 GB` (or more)
3. Redeploy

---

## Distribute the TUI/CLI globally

### Install globally with `pipx` (recommended)
```bash
pipx install silent-killer-agent
silent-killer --api-url https://<your-service>.onrender.com status
silent-killer monitor
```

### Install from source (dev)
```bash
git clone https://github.com/Blacksujit/Silent-Killer-AI-Agent.git
cd Silent-Killer-AI-Agent
pip install -e .
silent-killer --api-url https://<your-service>.onrender.com status
```

### Standalone binaries (future)
You can build binaries with PyInstaller and attach them to GitHub Releases for Windows/macOS/Linux.

---

## Troubleshooting

### Frontend can’t reach backend on Render
- Ensure `render.yaml` is present and committed
- Check Render logs for startup errors
- Verify `/api/health` returns 200

### Agent can’t connect to deployed backend
- Pass `--api-url https://<your-service>.onrender.com` to commands
- If you set `SILENT_KILLER_API_KEYS` on Render, pass `--api-key <key>` too

### Data resets after each deploy
- Add a Render Disk mounted to `/var/data` (see above)

---

## Next Steps (post-MVP)

- Add user authentication (session tokens) if you want per-user isolation
- Enable `SILENT_KILLER_API_KEYS` for private deployments
- Add Prometheus metrics and Grafana dashboards
- Package standalone binaries for the CLI/TUI

---

## Architecture Diagram (single-service)

```
┌─────────────────────────────────────┐
│         Render Web Service            │
│  (FastAPI + React static files)      │
│  Port: $PORT (8000)                  │
└─────────────┬───────────────────────┘
              │
   ┌──────────▼──────────┐
   │  FastAPI Backend    │
   │  /api/* routes      │
   └──────────┬──────────┘
              │
   ┌──────────▼──────────┐
   │  SQLite DB          │
   │  /var/data/store.db │
   └─────────────────────┘
```

---

## One-line status

- ✅ **Docker**: multi-stage (frontend + backend)
- ✅ **Render config**: `render.yaml` (public MVP)
- ✅ **CI/CD**: simplified, passes
- ✅ **Agent packaging**: `pyproject.toml` for global install
- ✅ **Local test checklist**: above

You’re ready to push and deploy. 🚀
