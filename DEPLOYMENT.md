# Pen Times Magazine — Deployment Guide

## Prerequisites

- Docker ≥ 24.x and Docker Compose v2
- A server with at least 2GB RAM (4GB recommended)
- A domain pointing to your server IP
- Cloudinary account for media
- Optional: Nginx for SSL termination

---

## 1. Clone and Configure

```bash
git clone https://github.com/your-org/pentimes.git
cd pentimes

# Create production env file — fill in ALL values
cp .env.production.example .env.production
nano .env.production
```

### Generate JWT secrets

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Run twice — one for JWT_SECRET, one for JWT_REFRESH_SECRET
```

---

## 2. Build and Start (Production)

```bash
# First deploy
docker compose -f docker-compose.prod.yml up --build -d

# Check all containers are healthy
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
```

Migrations run automatically inside the API container before the server starts.

---

## 3. Health Checks

```bash
# API health
curl http://localhost:4000/health

# Expected response
# {"status":"ok","timestamp":"...","services":{"database":"ok","redis":"ok"}}
```

---

## 4. Zero-Downtime Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart with zero-downtime (Compose replaces containers one by one)
docker compose -f docker-compose.prod.yml up --build -d --no-deps api
docker compose -f docker-compose.prod.yml up --build -d --no-deps web
```

---

## 5. Nginx and SSL

Nginx is the public entry point (ports 80/443). It serves everything on one
origin, `https://pentimes.ng`:

| Path                          | Goes to    |
|-------------------------------|------------|
| `/graphql`, `/upload`, `/health` | `api:4000` |
| everything else               | `web:3000` |

`www.pentimes.ng` redirects to `pentimes.ng`. The config lives in
`nginx/nginx.conf`, and the `nginx` service is enabled in
`docker-compose.prod.yml`. The web and API containers only publish ports on the
server's loopback (`127.0.0.1`), so they are not reachable from the internet.

### Get an SSL certificate (before the first `up`)

Nginx will not start without certificates. Point your DNS A records for
`pentimes.ng` and `www.pentimes.ng` at the server, then run this on the host
(port 80 must be free, so do it before starting the stack):

```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d pentimes.ng -d www.pentimes.ng
```

Certificates land in `/etc/letsencrypt/live/pentimes.ng/`, which the Nginx
container mounts read-only. After a renewal, reload Nginx:

```bash
docker exec pentimes_nginx_prod nginx -s reload
```

### Proxy hops and rate limiting

With Nginx as the only proxy, keep `TRUST_PROXY=1`. If you also put Cloudflare
in front of Nginx, set `TRUST_PROXY=2`, otherwise the API sees Cloudflare's IPs.

### Verify

```bash
curl http://localhost:4000/health          # from the server itself
curl https://pentimes.ng/health            # through Nginx
```

---
## 6. Database Backups

```bash
# Manual backup
docker exec pentimes_postgres_prod pg_dump \
  -U $POSTGRES_USER $POSTGRES_DB \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker exec -i pentimes_postgres_prod psql \
  -U $POSTGRES_USER $POSTGRES_DB \
  < backup_20250101_120000.sql
```

Set up a cron job for daily automated backups:

```cron
0 2 * * * /path/to/pentimes/scripts/backup.sh >> /var/log/pentimes-backup.log 2>&1
```

---

## 7. Pre-Deploy Checklist

- [ ] All secrets in `.env.production` — none hardcoded in code
- [ ] `NODE_ENV=production` set
- [ ] JWT secrets ≥ 64 hex characters each
- [ ] `COOKIE_SECURE=true` and `CORS_ORIGIN` set to production domain
- [ ] Cloudinary credentials valid
- [ ] `docker compose -f docker-compose.prod.yml config` runs without errors
- [ ] `/health` endpoint returns `{"status":"ok"}`
- [ ] Database migrations complete without errors
- [ ] Redis connection confirmed in API logs
- [ ] No `console.log` debug statements in production code
- [ ] Nginx configured with SSL certificates
- [ ] Database backup strategy in place

---

## 8. Monitoring

The `/health` endpoint returns:

```json
{
  "status": "ok",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "services": {
    "database": "ok",
    "redis": "ok"
  },
  "version": "0.1.0",
  "environment": "production",
  "uptime": 3600
}
```

Set up an uptime monitor (e.g. UptimeRobot, Better Uptime) pointing to `https://api.pentimes.ng/health`.

All application logs are structured JSON. Use any log aggregator:
- **Self-hosted**: Grafana + Loki + Promtail
- **Managed**: Datadog, LogDNA, CloudWatch Logs