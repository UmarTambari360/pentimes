#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
# Pen Times Magazine — PostgreSQL backup
#
# Dumps the production database from the running Postgres container into a
# timestamped, gzip-compressed file, verifies it, and deletes old backups.
#
#   Output : <repo>/backups/pentimes_YYYYMMDD_HHMMSS.sql.gz   (mode 600)
#   Cron   : 0 2 * * * /path/to/pentimes/scripts/backup.sh >> /var/log/pentimes-backup.log 2>&1
#   Restore: scripts/restore.sh backups/<file>.sql.gz
#
# Reads POSTGRES_USER / POSTGRES_DB from .env.production (or from the
# environment, which wins). Optional overrides:
#
#   ENV_FILE            path to the env file          (default: <repo>/.env.production)
#   BACKUP_DIR          where dumps are written       (default: <repo>/backups)
#   POSTGRES_CONTAINER  container name                (default: pentimes_postgres_prod)
#   RETENTION_DAYS      delete dumps older than this  (default: 14; 0 = keep forever)
#
# NOTE: backups on the same disk as the database do not survive a lost server.
# Copy the backups/ folder off the machine as well (rsync, rclone, object storage).
# ──────────────────────────────────────────────────────────────────

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

ENV_FILE="${ENV_FILE:-$PROJECT_DIR/.env.production}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
CONTAINER="${POSTGRES_CONTAINER:-pentimes_postgres_prod}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

log() { printf '%s [backup] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }
die() { log "ERROR: $*" >&2; exit 1; }

# Reads KEY from the env file without `source`-ing it (values may contain
# characters the shell would interpret). Strips CRs and surrounding quotes.
env_file_value() {
  [ -f "$ENV_FILE" ] || return 0
  grep -E "^$1=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d '\r' \
    | sed -e "s/^['\"]//" -e "s/['\"]$//"
}

PG_USER="${POSTGRES_USER:-$(env_file_value POSTGRES_USER)}"
PG_DB="${POSTGRES_DB:-$(env_file_value POSTGRES_DB)}"

[ -n "$PG_USER" ] || die "POSTGRES_USER is not set (looked in the environment and $ENV_FILE)"
[ -n "$PG_DB" ]   || die "POSTGRES_DB is not set (looked in the environment and $ENV_FILE)"
[[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] || die "RETENTION_DAYS must be a whole number, got '$RETENTION_DAYS'"

command -v docker >/dev/null 2>&1 || die "docker is not installed or not in PATH"
[ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null || true)" = "true" ] \
  || die "container '$CONTAINER' is not running"

umask 077   # dumps contain user data: owner-only access
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FINAL="$BACKUP_DIR/pentimes_${TIMESTAMP}.sql.gz"
PARTIAL="$FINAL.partial"

trap 'log "FAILED (line $LINENO) — no backup was kept"' ERR
trap 'rm -f "$PARTIAL"' EXIT

log "Backing up database '$PG_DB' from container '$CONTAINER'"

# --clean --if-exists makes the dump self-contained: restoring replaces the
# existing objects instead of failing on "already exists".
docker exec "$CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" \
  --clean --if-exists --no-owner --no-privileges \
  | gzip -9 > "$PARTIAL"

# A truncated dump is worse than none: confirm the archive is intact AND that
# pg_dump reached its final line before we keep the file.
gzip -t "$PARTIAL" || die "compressed file is corrupt"
gzip -dc "$PARTIAL" | tail -n 5 | grep -q 'PostgreSQL database dump complete' \
  || die "dump looks incomplete (missing completion marker)"

mv "$PARTIAL" "$FINAL"
log "OK: $FINAL ($(du -h "$FINAL" | cut -f1))"

# ── Retention ────────────────────────────────────────────────────
if [ "$RETENTION_DAYS" -gt 0 ]; then
  while IFS= read -r old; do
    log "Removed old backup: $(basename "$old")"
  done < <(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'pentimes_*.sql.gz' \
             -mtime +"$RETENTION_DAYS" -print -delete)
fi

log "Backups on disk: $(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'pentimes_*.sql.gz' | wc -l)"