#!/bin/bash
# ──────────────────────────────────────────────────────────────────
# Pen Times Magazine — Database Backup Script
# Run via cron: 0 2 * * * /path/to/pentimes/scripts/backup.sh
# ──────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/pentimes_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

# Load env
if [ -f "${PROJECT_DIR}/.env.production" ]; then
  # shellcheck disable=SC1091
  set -a
  source "${PROJECT_DIR}/.env.production"
  set +a
fi

mkdir -p "$BACKUP_DIR"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting backup..."

docker exec pentimes_postgres_prod pg_dump \
  -U "${POSTGRES_USER}" \
  "${POSTGRES_DB}" \
  | gzip > "$BACKUP_FILE"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Backup saved: ${BACKUP_FILE}"

# Prune backups older than RETENTION_DAYS
find "$BACKUP_DIR" -name "pentimes_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Old backups pruned (>${RETENTION_DAYS} days)"