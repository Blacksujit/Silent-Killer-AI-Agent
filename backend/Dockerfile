FROM python:3.11-slim

# Create app user and group for non-root operation
RUN groupadd --gid 1000 appuser || true && \
	useradd --uid 1000 --gid 1000 --shell /bin/bash --create-home appuser || true

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1

WORKDIR /app

# Install system deps required for sqlite, curl and typical wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
	build-essential \
	libsqlite3-dev \
	ca-certificates \
	curl \
	&& rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy the application code
COPY backend/app /app/app

# Create directory for runtime data (sqlite db)
RUN mkdir -p /app/data && chown -R appuser:appuser /app/data /app/app

USER appuser

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl --fail http://127.0.0.1:8000/api/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]
