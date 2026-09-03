#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${KIND_ROBOTS_APP_DIR:-/mnt/user/appdata/kind_robots}"
IMAGE="${KIND_ROBOTS_IMAGE:-ghcr.io/silasfelinus/kind_robots:latest}"
CONTAINER="${KIND_ROBOTS_CONTAINER:-KindRobots}"
NETWORK="${KIND_ROBOTS_NETWORK:-cafepurr}"
ENV_FILE="${KIND_ROBOTS_ENV_FILE:-$APP_DIR/.env}"
MIGRATION_ENV="${KIND_ROBOTS_MIGRATION_ENV:-$APP_DIR/.secrets/kindrobots-db-migrate.env}"
STATE_DIR="${KIND_ROBOTS_DEPLOY_STATE_DIR:-/boot/config/plugins/kindrobots-auto-deploy}"
STATE_FILE="$STATE_DIR/last-migrated-image"
LOCK_FILE="${KIND_ROBOTS_DEPLOY_LOCK:-/var/lock/kindrobots-auto-deploy.lock}"
UNRAID_UPDATE_SCRIPT="${KIND_ROBOTS_UNRAID_UPDATE_SCRIPT:-/usr/local/emhttp/plugins/dynamix.docker.manager/scripts/update_container}"
MIGRATION_RECHECK_SECONDS="${KIND_ROBOTS_MIGRATION_RECHECK_SECONDS:-86400}"
HEALTH_TIMEOUT_SECONDS="${KIND_ROBOTS_HEALTH_TIMEOUT_SECONDS:-120}"

log() {
  printf '[kindrobots-deploy] %s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

fail() {
  log "ERROR: $*"
  exit 1
}

require_file() {
  [[ -r "$1" ]] || fail "required file is not readable: $1"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command is missing: $1"
}

require_command docker
require_command flock
require_command php
require_file "$ENV_FILE"
require_file "$UNRAID_UPDATE_SCRIPT"

touch "$LOCK_FILE"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log 'another deploy is already running; exiting cleanly'
  exit 0
fi

mkdir -p "$STATE_DIR"

if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
  fail "Unraid container '$CONTAINER' does not exist"
fi

load_migration_credential() {
  require_file "$MIGRATION_ENV"
  set -a
  # shellcheck disable=SC1090
  . "$MIGRATION_ENV"
  set +a
  case "${MIGRATION_DATABASE_URL:-}" in
    mysql://*) ;;
    *) fail "MIGRATION_DATABASE_URL is missing or malformed in $MIGRATION_ENV" ;;
  esac
}

run_migrations() {
  local image_ref="$1"
  log "applying pending migrations from image $image_ref"
  docker run --rm \
    --network "$NETWORK" \
    --env-file "$ENV_FILE" \
    -e MIGRATION_DATABASE_URL \
    "$image_ref" \
    node scripts/prisma-migrate-deploy.mjs
}

write_migration_state() {
  local image_id="$1"
  local tmp="$STATE_FILE.tmp"
  printf '%s\n' "$image_id" > "$tmp"
  mv "$tmp" "$STATE_FILE"
}

state_is_fresh_for() {
  local image_id="$1"
  [[ -r "$STATE_FILE" ]] || return 1
  [[ "$(head -n 1 "$STATE_FILE" 2>/dev/null || true)" == "$image_id" ]] || return 1

  local now modified age
  now="$(date +%s)"
  modified="$(stat -c %Y "$STATE_FILE" 2>/dev/null || echo 0)"
  age=$((now - modified))
  (( age < MIGRATION_RECHECK_SECONDS ))
}

wait_for_health() {
  local deadline=$(( $(date +%s) + HEALTH_TIMEOUT_SECONDS ))
  local status

  while (( $(date +%s) < deadline )); do
    status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$CONTAINER" 2>/dev/null || true)"
    case "$status" in
      healthy|running)
        log "container health is $status"
        return 0
        ;;
      unhealthy|exited|dead)
        fail "container entered terminal health state: $status"
        ;;
    esac
    sleep 5
  done

  fail "container did not become healthy within ${HEALTH_TIMEOUT_SECONDS}s"
}

log "checking registry image $IMAGE"
docker pull "$IMAGE"

latest_id="$(docker image inspect -f '{{.Id}}' "$IMAGE")"
running_id="$(docker inspect -f '{{.Image}}' "$CONTAINER")"

needs_update=false
if [[ "$running_id" != "$latest_id" ]]; then
  needs_update=true
  log "new image detected: running=$running_id latest=$latest_id"
fi

if [[ "$needs_update" == true ]] || ! state_is_fresh_for "$latest_id"; then
  load_migration_credential
  run_migrations "$IMAGE"
  write_migration_state "$latest_id"
else
  log 'migration state is current; no migration pass needed'
fi

if [[ "$needs_update" == false ]]; then
  log 'KindRobots already runs the latest image'
  exit 0
fi

log "updating $CONTAINER through Unraid DockerMan"
php -q "$UNRAID_UPDATE_SCRIPT" "$CONTAINER"

deployed_id="$(docker inspect -f '{{.Image}}' "$CONTAINER")"

if [[ "$deployed_id" != "$latest_id" ]]; then
  log "registry moved during deploy or DockerMan selected a different image: expected=$latest_id deployed=$deployed_id"
  log 'stopping the app briefly so the exact deployed image can migrate before serving'
  docker stop "$CONTAINER" >/dev/null
  load_migration_credential
  run_migrations "$deployed_id"
  write_migration_state "$deployed_id"
  docker start "$CONTAINER" >/dev/null
fi

wait_for_health

final_id="$(docker inspect -f '{{.Image}}' "$CONTAINER")"
log "deploy complete: container=$CONTAINER image=$final_id"
