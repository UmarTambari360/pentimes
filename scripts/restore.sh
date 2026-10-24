#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
# Pen Times Magazine — PostgreSQL restore
#
# Restores a dump made by scripts/backup.sh into the running Postgres
# container. DESTRUCTIVE: it replaces the current contents of the database.
#
#   Usage: scripts/restore.sh [--yes] backups/pentimes_YYYYMMDD_HHMMSS.sql.gz
#
#   --yes   skip the confirmation prompt (for automation)
#
# The restore replaces the whole schema and runs in a single transaction: if
# anything fails, the database is left exactly as it was.
#
# Recommended order:
#   1. Stop the app so nothing writes during the restore:
#        docker compose --env-file .env.production -f docker-compose.prod.yml stop web api
#   2. Run this script.
#   3. Start the app again:
#        docker compose --env-file .env.production -f docker-compose.prod.yml start api web
#
# Same optional overrides as backup.sh: ENV_FILE, POSTGRES_CONTAINER.
# ──────────────────────────────────────────────────────────────────

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

ENV_FILE="${ENV_FILE:-$PROJECT_DIR/.env.production}"
CONTAINER="${POSTGRES_CONTAINER:-pentimes_postgres_prod}"

log() { printf '%s [restore] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }
die() { log "ERROR: $*" >&2; exit 1; }

ASSUME_YES=false
BACKUP_FILE=""
for arg in "$@"; do
  case "$arg" in
    --yes|-y)  ASSUME_YES=true ;;
    -h|--help) sed -n '2,22p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*)        die "unknown option: $arg" ;;
    *)         [ -z "$BACKUP_FILE" ] || die "only one backup file can be given"; BACKUP_FILE="$arg" ;;
  esac
done

[ -n "$BACKUP_FILE" ] || die "usage: scripts/restore.sh [--yes] <backup.sql.gz>"
[ -f "$BACKUP_FILE" ] || die "file not found: $BACKUP_FILE"

env_file_value() {
  [ -f "$ENV_FILE" ] || return 0
  grep -E "^$1=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d '\r' \
    | sed -e "s/^['\"]//" -e "s/['\"]$//"
}

PG_USER="${POSTGRES_USER:-$(env_file_value POSTGRES_USER)}"
PG_DB="${POSTGRES_DB:-$(env_file_value POSTGRES_DB)}"

[ -n "$PG_USER" ] || die "POSTGRES_USER is not set (looked in the environment and $ENV_FILE)"
[ -n "$PG_DB" ]   || die "POSTGRES_DB is not set (looked in the environment and $ENV_FILE)"

command -v docker >/dev/null 2>&1 || die "docker is not installed or not in PATH"
[ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null || true)" = "true" ] \
  || die "container '$CONTAINER' is not running"

gzip -t "$BACKUP_FILE" || die "backup file is corrupt: $BACKUP_FILE"

if [ "$ASSUME_YES" != true ]; then
  [ -t 0 ] || die "no terminal to confirm on; pass --yes to run non-interactively"
  printf '\nThis will OVERWRITE database "%s" in container "%s"\nwith the contents of %s.\n' \
    "$PG_DB" "$CONTAINER" "$BACKUP_FILE"
  printf 'Make sure web and api are stopped. Type the database name to continue: '
  read -r answer
  [ "$answer" = "$PG_DB" ] || die "confirmation did not match; nothing was changed"
fi

log "Restoring '$BACKUP_FILE' into '$PG_DB' (single transaction)"

# The `public` schema is dropped first (inside the same transaction) so the
# database ends up EXACTLY as it was at backup time. Without this, tables
# created after the backup would linger and later collide with migrations.
# `-o /dev/null` hides psql's result rows only; errors still go to stderr.
{
  echo 'SET client_min_messages = warning;'   # hide harmless "drop cascades" notices
  echo 'DROP SCHEMA IF EXISTS public CASCADE;'
  echo 'CREATE SCHEMA public;'
  gzip -dc "$BACKUP_FILE"
} | docker exec -i "$CONTAINER" psql -U "$PG_USER" -d "$PG_DB" \
      -v ON_ERROR_STOP=1 --single-transaction --quiet -o /dev/null

log "OK: restore complete. Start the app again (docker compose ... start api web)."