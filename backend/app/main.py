from fastapi import FastAPI
from fastapi import Query, HTTPException
from contextlib import asynccontextmanager
import logging
from typing import Optional
from pathlib import Path
from fastapi.responses import JSONResponse

from .api import ingest, suggestions, actions, admin, agent, ambient
import asyncio
import os
from .core import store as core_store
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context that starts a background prune worker and cancels it on shutdown.

    This replaces the deprecated `@app.on_event('startup')` pattern and provides
    a clear cancellation point for background tasks.
    """
    logger.info("Application startup - initializing background tasks")
    stop_event = asyncio.Event()

    async def _prune_worker():
        interval = int(os.environ.get('SILENT_KILLER_PRUNE_INTERVAL_SECONDS', '3600'))
        logger.info(f"Prune worker started with interval: {interval} seconds")
        try:
            while not stop_event.is_set():
                try:
                    if hasattr(core_store.store, 'prune'):
                        logger.info("Running scheduled prune operation")
                        core_store.store.prune()
                        logger.info("Prune operation completed")
                except Exception as e:
                    logger.error(f"Error during prune operation: {e}")
                    # best-effort pruning; ignore errors
                    pass
                try:
                    await asyncio.wait_for(stop_event.wait(), timeout=interval)
                except asyncio.TimeoutError:
                    # timeout -> loop again
                    continue
        except asyncio.CancelledError:
            logger.info("Prune worker cancelled")
            # allow cancellation to bubble
            pass

    # start worker
    prune_task = asyncio.create_task(_prune_worker())
    try:
        yield
    finally:
        # signal and cancel the worker
        logger.info("Application shutdown - stopping background tasks")
        stop_event.set()
        prune_task.cancel()
        try:
            await prune_task
        except Exception as e:
            logger.error(f"Error stopping prune worker: {e}")
            pass


def create_app() -> FastAPI:
    logger.info("Creating FastAPI application")
    app = FastAPI(title="SILENT KILLER - MVP", lifespan=lifespan)

    # routers
    app.include_router(ingest.router, prefix="/api")
    app.include_router(suggestions.router, prefix="/api")
    app.include_router(actions.router, prefix="/api")
    app.include_router(admin.router, prefix="/api/admin")
    app.include_router(agent.router, prefix="/api/agent")
    app.include_router(ambient.router, prefix="/api/ambient")

    @app.get('/api/health')
    def health():
        logger.debug("Health check endpoint called")
        response = {"status": "ok"}
        return JSONResponse(content=response, headers={"Cache-Control": "public, max-age=10"})

    @app.get('/api/stats')
    def stats(user_id: str = Query(...), since: Optional[str] = Query(None)):
        # since is accepted for forward-compat; currently best-effort parsed by store.get_events callers
        if not user_id:
            return {"user_id": user_id, "event_count": 0, "last_event_ts": None}
        try:
            events = core_store.store.get_events(user_id, None)
        except Exception:
            events = []
        last_ts = None
        try:
            if events:
                last_ts = max([e.get('timestamp') for e in events if e.get('timestamp')], default=None)
        except Exception:
            last_ts = None
        if hasattr(last_ts, 'isoformat'):
            last_ts = last_ts.isoformat()
        response = {"user_id": user_id, "event_count": len(events), "last_event_ts": last_ts}
        return JSONResponse(content=response, headers={"Cache-Control": "public, max-age=5"})

    # Serve built frontend if available (single-service deployment).
    # In Docker/Render we set SILENT_KILLER_STATIC_DIR=/app/static.
    static_dir = Path(os.environ.get('SILENT_KILLER_STATIC_DIR', '/app/static'))
    index_file = static_dir / 'index.html'
    if index_file.exists():
        app.mount('/', StaticFiles(directory=str(static_dir), html=True), name='frontend')

        @app.get('/{full_path:path}', include_in_schema=False)
        def spa_fallback(full_path: str):
            # Never hijack API routes
            if full_path.startswith('api/'):
                raise HTTPException(status_code=404, detail='Not found')
            return FileResponse(str(index_file))

    logger.info("FastAPI application created successfully")
    return app


app = create_app()
