# SILENT KILLER - Deployment Guide

## 🚀 Production Deployment

This guide covers deploying SILENT KILLER in production environments.

## 📋 Prerequisites

- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (for frontend builds)
- **Python 3.11+** (for backend)
- **Reverse proxy** (nginx, Apache, or cloud load balancer)
- **SSL certificates** (HTTPS required for production)

## 🐳 Docker Deployment (Recommended)

### 1. Environment Setup

```bash
# Clone repository
git clone https://github.com/your-repo/silent-killer.git
cd silent-killer

# Copy environment template
cp .env.example .env

# Edit production configuration
nano .env
```

### 2. Production Environment Variables

```bash
# .env
# API Configuration
SILENT_KILLER_API_URL=https://your-domain.com
SILENT_KILLER_API_KEYS=prod-key-1,prod-key-2,prod-key-3
USER_ID=production

# Storage & Privacy
SILENT_KILLER_STORE=sqlite
SILENT_KILLER_SQLITE_PATH=/app/data/store.db
SILENT_KILLER_RETENTION_DAYS=90
SILENT_KILLER_PII_SALT=your-secure-random-salt-64-chars

# Security
SILENT_KILLER_AUTO_EXEC_CONF=0.95
SILENT_KILLER_PRUNE_INTERVAL_SECONDS=7200

# Performance
WORKERS=4
MAX_CONNECTIONS=1000
```

### 3. Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - SILENT_KILLER_STORE=sqlite
      - SILENT_KILLER_SQLITE_PATH=/app/data/store.db
      - SILENT_KILLER_RETENTION_DAYS=90
      - SILENT_KILLER_API_KEYS=${API_KEYS}
      - SILENT_KILLER_PII_SALT=${PII_SALT}
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "--fail", "http://127.0.0.1:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

  monitoring:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./data/prometheus:/prometheus
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - ./monitoring/grafana:/etc/grafana
      - ./data/grafana:/var/lib/grafana
    depends_on:
      - monitoring
    restart: unless-stopped
```

### 4. Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=web:10m rate=20r/s;

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend routes
        location / {
            limit_req zone=web burst=50 nodelay;
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://backend/api/health;
            access_log off;
        }
    }
}
```

### 5. Deploy

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up --build -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🌐 Cloud Deployment

### AWS ECS

```yaml
# ecs-task-definition.json
{
  "family": "silent-killer",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-registry/silent-killer-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "SILENT_KILLER_API_KEYS",
          "value": "prod-key-1,prod-key-2"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/silent-killer",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Google Cloud Run

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/silent-killer-backend

# Deploy to Cloud Run
gcloud run deploy silent-killer-backend \
  --image gcr.io/PROJECT_ID/silent-killer-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SILENT_KILLER_API_KEYS=prod-key-1,prod-key-2
```

### Azure Container Instances

```yaml
# azure-container.yaml
apiVersion: 2021-03-01
location: eastus
name: silent-killer-group
properties:
  containers:
  - name: backend
    properties:
      image: your-registry/silent-killer-backend:latest
      ports:
      - port: 8000
      environmentVariables:
      - name: SILENT_KILLER_API_KEYS
        value: prod-key-1,prod-key-2
      resources:
        requests:
          cpu: 1.0
          memoryInGb: 2.0
```

## 🔧 Manual Deployment

### Backend Setup

```bash
# 1. Install Python dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# 2. Configure environment
export SILENT_KILLER_API_KEYS="prod-key-1,prod-key-2"
export SILENT_KILLER_STORE=sqlite
export SILENT_KILLER_SQLITE_PATH=/var/lib/silent-killer/store.db

# 3. Create directories
sudo mkdir -p /var/lib/silent-killer
sudo chown $USER:$USER /var/lib/silent-killer

# 4. Start backend with Gunicorn
gunicorn backend.app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile /var/log/silent-killer/access.log \
  --error-logfile /var/log/silent-killer/error.log \
  --daemon
```

### Frontend Setup

```bash
# 1. Install Node.js dependencies
cd frontend
npm ci

# 2. Build for production
npm run build

# 3. Serve with nginx or Apache
# nginx.conf
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 📊 Monitoring & Logging

### Prometheus Metrics

```python
# backend/app/core/metrics.py
from prometheus_client import Counter, Histogram, Gauge, generate_latest

# Metrics
REQUESTS_TOTAL = Counter('silent_killer_requests_total', 'Total requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('silent_killer_request_duration_seconds', 'Request duration')
ACTIVE_USERS = Gauge('silent_killer_active_users', 'Active users')
SUGGESTIONS_GENERATED = Counter('silent_killer_suggestions_generated_total', 'Suggestions generated')
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "SILENT KILLER Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(silent_killer_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Active Users",
        "type": "stat",
        "targets": [
          {
            "expr": "silent_killer_active_users"
          }
        ]
      }
    ]
  }
}
```

## 🔒 Security Considerations

### 1. API Security

- Use strong API keys with proper entropy
- Implement rate limiting
- Enable HTTPS with valid certificates
- Regular security updates

### 2. Data Protection

- Encrypt sensitive data at rest
- Use secure PII salts
- Implement data retention policies
- Regular backups with encryption

### 3. Network Security

```bash
# Firewall rules
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw deny 8000/tcp  # Backend (internal only)
ufw enable
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    tags: ['v*']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        run: |
          docker-compose -f docker-compose.prod.yml up --build -d
          
      - name: Health check
        run: |
          curl -f https://your-domain.com/api/health
```

## 📈 Performance Optimization

### 1. Database Optimization

```sql
-- SQLite optimizations
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = memory;
```

### 2. Caching

```python
# Redis caching for frequent queries
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

@cache.memoize(ttl=300)
def get_user_suggestions(user_id):
    # Cache suggestions for 5 minutes
    pass
```

### 3. Load Balancing

```nginx
upstream backend_pool {
    least_conn;
    server backend1:8000 max_fails=3 fail_timeout=30s;
    server backend2:8000 max_fails=3 fail_timeout=30s;
    server backend3:8000 max_fails=3 fail_timeout=30s;
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Backend not starting**
   ```bash
   # Check logs
   docker-compose logs backend
   
   # Check configuration
   docker-compose config
   ```

2. **High memory usage**
   ```bash
   # Monitor memory
   docker stats
   
   # Adjust worker count
   # In docker-compose.yml
   environment:
     - WORKERS=2  # Reduce from 4
   ```

3. **Slow API responses**
   ```bash
   # Check database size
   ls -lh /app/data/store.db
   
   # Run vacuum
   sqlite3 /app/data/store.db "VACUUM;"
   ```

### Health Checks

```bash
# Backend health
curl https://your-domain.com/api/health

# Frontend health
curl https://your-domain.com/

# Database connectivity
docker-compose exec backend python -c "
from backend.app.core.store import store
print('Database connection:', len(store.get_events('test_user')))
"
```

## 📋 Maintenance

### Daily Tasks

- [ ] Check error logs
- [ ] Monitor resource usage
- [ ] Verify SSL certificates
- [ ] Backup database

### Weekly Tasks

- [ ] Update dependencies
- [ ] Review security patches
- [ ] Analyze performance metrics
- [ ] Clean up old logs

### Monthly Tasks

- [ ] Security audit
- [ ] Performance review
- [ ] Capacity planning
- [ ] Backup verification

## 📞 Support

For deployment issues:

1. Check the troubleshooting section above
2. Review logs for error messages
3. Verify environment configuration
4. Check system resources

For additional support:
- Create an issue on GitHub
- Email: support@silent-killer.com
- Documentation: https://docs.silent-killer.com
