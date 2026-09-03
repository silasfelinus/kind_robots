#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${KIND_ROBOTS_APP_DIR:-/mnt/user/appdata/kind_robots}"
STATE_DIR="${KIND_ROBOTS_DEPLOY_STATE_DIR:-/boot/config/plugins/kindrobots-auto-deploy}"
CUSTOM_CRON_DIR="${KIND_ROBOTS_CUSTOM_CRON_DIR:-/boot/config/plugins/custom_cron}"
CRON_FILE="$CUSTOM_CRON_DIR/kindrobots-auto-deploy.cron"
LAUNCHER="$STATE_DIR/run.sh"
LOG_FILE="${KIND_ROBOTS_DEPLOY_LOG:-/var/log/kindrobots-auto-deploy.log}"
CRON_SCHEDULE="${KIND_ROBOTS_DEPLOY_CRON:-*/5 * * * *}"

log() {
  printf '[kindrobots-auto-deploy-install] %s\n' "$*"
}

fail() {
  log "ERROR: $*"
  exit 1
}

[[ "${EUID:-$(id -u)}" -eq 0 ]] || fail 'run this installer as root on the Unraid host'
[[ -d "$APP_DIR/.git" ]] || fail "$APP_DIR is not the Kind Robots git checkout"
[[ -r "$APP_DIR/scripts/deploy-unraid.sh" ]] || fail 'scripts/deploy-unraid.sh is missing; pull the current Kind Robots main branch first'
command -v git >/dev/null 2>&1 || fail 'git is required'
command -v update_cron >/dev/null 2>&1 || fail 'Unraid update_cron is required'

mkdir -p "$STATE_DIR" "$CUSTOM_CRON_DIR"

cat > "$LAUNCHER" <<EOF
#!/usr/bin/env bash
set -Eeuo pipefail
APP_DIR="$APP_DIR"

log() {
  printf '[kindrobots-auto-deploy] %s %s\\n' "\$(date '+%Y-%m-%d %H:%M:%S')" "\$*"
}

if [[ -d "\$APP_DIR/.git" ]]; then
  branch="\$(git -C "\$APP_DIR" branch --show-current 2>/dev/null || true)"
  if [[ "\$branch" == main ]] && git -C "\$APP_DIR" diff --quiet && git -C "\$APP_DIR" diff --cached --quiet; then
    if git -C "\$APP_DIR" pull --ff-only --quiet; then
      log 'refreshed deployment scripts from origin/main'
    else
      log 'WARNING: git pull failed; using the deployment script already on disk'
    fi
  else
    log 'WARNING: checkout is not a clean main branch; skipping automatic git pull'
  fi
fi

exec /bin/bash "\$APP_DIR/scripts/deploy-unraid.sh"
EOF
chmod 0755 "$LAUNCHER"

printf '%s %s >> %q 2>&1\n' "$CRON_SCHEDULE" "/bin/bash $LAUNCHER" "$LOG_FILE" > "$CRON_FILE"
chmod 0600 "$CRON_FILE"

update_cron

log "installed persistent cron: $CRON_SCHEDULE"
log "launcher: $LAUNCHER"
log "log: $LOG_FILE"
log 'running one deployment check now so installation fails loudly if credentials or Unraid wiring are wrong'

/bin/bash "$LAUNCHER"

log 'automatic Kind Robots deployment is installed'
