# Multi-stage build: frontend (Vite) + backend (FastAPI)

# 1) Build frontend
FROM node:18-alpine AS frontend-build
WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# 2) Backend runtime
FROM python:3.11-slim AS runtime

# Create app user and group for non-root operation
RUN groupadd --gid 1000 appuser || true && \
	useradd --uid 1000 --gid 1000 --shell /bin/bash --create-home appuser || true

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1 \
	SILENT_KILLER_STATIC_DIR=/app/static \
	PYTHONPATH=/app

WORKDIR /app

# System deps for wheels + sqlite + healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
	build-essential \
	libsqlite3-dev \
	ca-certificates \
	curl \
	&& rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy backend code
COPY backend/app /app/app

# Copy built frontend
COPY --from=frontend-build /frontend/dist /app/static

# Prepare runtime data dir (Render disk can be mounted here)
RUN mkdir -p /var/data && chown -R appuser:appuser /var/data /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl --fail http://127.0.0.1:${PORT:-8000}/api/health || exit 1

# Render provides PORT; default to 8000 for local docker
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info"]
