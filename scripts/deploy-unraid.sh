#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${KIND_ROBOTS_APP_DIR:-/mnt/user/appdata/kind_robots}"
IMAGE="${KIND_ROBOTS_IMAGE:-ghcr.io/silasfelinus/kind_robots:latest}"
CONTAINER="${KIND_ROBOTS_CONTAINER:-KindRobots}"
NETWORK="${KIND_ROBOTS_NETWORK:-cafepurr}"
ENV_FILE="${KIND_ROBOTS_ENV_FILE:-$APP_DIR/.env}"
MIGRATION_ENV="${KIND_ROBOTS_MIGRATION_ENV:-$APP_DIR/.secrets/kindrobots-db-migrate.env}"
STATE_DIR="${KIND_ROBOTS_DEPLOY_STATE_DIR:-$APP_DIR/.deploy-state}"
STATE_FILE="$STATE_DIR/last-migrated-image"
LOCK_FILE="${KIND_ROBOTS_DEPLOY_LOCK:-/var/lock/kindrobots-auto-deploy.lock}"
UNRAID_UPDATE_SCRIPT="${KIND_ROBOTS_UNRAID_UPDATE_SCRIPT:-/usr/local/emhttp/plugins/dynamix.docker.manager/scripts/update_container}"
MIGRATION_RECHECK_SECONDS="${KIND_ROBOTS_MIGRATION_RECHECK_SECONDS:-86400}"
HEALTH_TIMEOUT_SECONDS="${KIND_ROBOTS_HEALTH_TIMEOUT_SECONDS:-120}"
IMAGE_SOURCE_LABEL="${KIND_ROBOTS_IMAGE_SOURCE_LABEL:-https://github.com/silasfelinus/kind_robots}"

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

container_state() {
  docker inspect -f '{{.State.Status}}' "$CONTAINER" 2>/dev/null || true
}

container_health() {
  docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$CONTAINER" 2>/dev/null || true
}

wait_for_health() {
  local deadline=$(( $(date +%s) + HEALTH_TIMEOUT_SECONDS ))
  local state=""
  local status=""

  while (( $(date +%s) < deadline )); do
    state="$(container_state)"
    if [[ "$state" != "running" ]]; then
      log "container is not running while waiting for health: ${state:-missing}"
      return 1
    fi

    status="$(container_health)"
    case "$status" in
      healthy|running)
        log "container health is $status"
        return 0
        ;;
      unhealthy)
        log 'container health is unhealthy'
        return 1
        ;;
    esac
    sleep 5
  done

  log "container did not become healthy within ${HEALTH_TIMEOUT_SECONDS}s (state=${state:-unknown} health=${status:-unknown})"
  return 1
}

ensure_container_running() {
  local state
  state="$(container_state)"
  if [[ "$state" == "running" ]]; then
    return 0
  fi

  log "container state is ${state:-missing}; starting $CONTAINER"
  docker start "$CONTAINER" >/dev/null || fail "could not start $CONTAINER"
}

recover_container_after_failed_health() {
  local state
  state="$(container_state)"

  if [[ "$state" == "running" ]]; then
    log 'container failed health after deploy; restarting it once'
    docker restart "$CONTAINER" >/dev/null || fail "could not restart $CONTAINER"
  else
    log "container state is ${state:-missing} after deploy; starting it"
    docker start "$CONTAINER" >/dev/null || fail "could not start $CONTAINER after deploy"
  fi

  if ! wait_for_health; then
    fail 'container recovery attempt did not become healthy'
  fi
}

cleanup_dangling_kindrobots_images() {
  local current_id="$1"
  local image_id removed=0

  # DockerMan retags `latest` to the new image when it recreates the container,
  # which leaves the prior locally-pulled build as a dangling image. Only remove
  # dangling images that carry Kind Robots' OCI source label. This deliberately
  # avoids a host-wide `docker image prune`, so other containers keep their own
  # rollback/cache images.
  while IFS= read -r image_id; do
    [[ -n "$image_id" ]] || continue
    [[ "$image_id" == "$current_id" ]] && continue

    if docker image rm "$image_id" >/dev/null 2>&1; then
      removed=$((removed + 1))
    else
      log "WARNING: could not remove dangling KindRobots image $image_id; leaving it alone"
    fi
  done < <(
    docker image ls \
      --quiet \
      --filter dangling=true \
      --filter "label=org.opencontainers.image.source=$IMAGE_SOURCE_LABEL"
  )

  if (( removed > 0 )); then
    log "removed $removed dangling KindRobots image(s)"
  fi
}

stopped_for_exact_image_migration=false
restart_after_interrupted_exact_image_migration() {
  if [[ "$stopped_for_exact_image_migration" == true ]]; then
    log "deploy interrupted after stopping $CONTAINER; attempting to restore service"
    if ! docker start "$CONTAINER" >/dev/null 2>&1; then
      log "WARNING: automatic restore of $CONTAINER failed"
    fi
  fi
}
trap restart_after_interrupted_exact_image_migration EXIT

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
  ensure_container_running
  if ! wait_for_health; then
    fail 'KindRobots already runs the latest image but is not healthy'
  fi
  cleanup_dangling_kindrobots_images "$running_id"
  log 'KindRobots already runs the latest image and is healthy'
  exit 0
fi

log "updating $CONTAINER through Unraid DockerMan"
php -q "$UNRAID_UPDATE_SCRIPT" "$CONTAINER"

if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
  fail "DockerMan update completed but $CONTAINER is missing"
fi

deployed_id="$(docker inspect -f '{{.Image}}' "$CONTAINER")"

if [[ "$deployed_id" != "$latest_id" ]]; then
  log "registry moved during deploy or DockerMan selected a different image: expected=$latest_id deployed=$deployed_id"
  log 'stopping the app briefly so the exact deployed image can migrate before serving'
  stopped_for_exact_image_migration=true
  docker stop "$CONTAINER" >/dev/null
  load_migration_credential
  run_migrations "$deployed_id"
  write_migration_state "$deployed_id"
  docker start "$CONTAINER" >/dev/null
  stopped_for_exact_image_migration=false
fi

if ! wait_for_health; then
  recover_container_after_failed_health
fi

final_id="$(docker inspect -f '{{.Image}}' "$CONTAINER")"
cleanup_dangling_kindrobots_images "$final_id"
log "deploy complete: container=$CONTAINER image=$final_id"
