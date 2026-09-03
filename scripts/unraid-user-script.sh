#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${KIND_ROBOTS_APP_DIR:-/mnt/user/appdata/kind_robots}"

log() {
  printf '[kindrobots-user-script] %s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

if [[ ! -d "$APP_DIR/.git" ]]; then
  log "ERROR: $APP_DIR is not the Kind Robots checkout"
  exit 1
fi

branch="$(git -C "$APP_DIR" branch --show-current 2>/dev/null || true)"
if [[ "$branch" == main ]] && git -C "$APP_DIR" diff --quiet && git -C "$APP_DIR" diff --cached --quiet; then
  if git -C "$APP_DIR" pull --ff-only --quiet; then
    log 'refreshed deployment scripts from origin/main'
  else
    log 'WARNING: git pull failed; using the deployment script already on disk'
  fi
else
  log 'WARNING: checkout is not a clean main branch; skipping automatic git pull'
fi

exec /bin/bash "$APP_DIR/scripts/deploy-unraid.sh"
