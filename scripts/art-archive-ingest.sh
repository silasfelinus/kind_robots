#!/usr/bin/env bash
#
# Run an Art Archive dry run or import from Alexandria instead of the browser.
#
# WHY THIS EXISTS
# ---------------
# The admin page's Dry Run / Import buttons call the same two endpoints, but a
# browser fetch has a client-side timeout and a tab that can be closed mid-scan.
# The first bulk pass over a large archive is exactly the case that breaks
# (Silas, 2026-09-22: "Request timed out after 10000ms ... it would probably be
# better to fix the latter by running a script in the actual drive rather than
# via front end").
#
# HOW IT REACHES THE APP
# ----------------------
# Through `docker exec` into the KindRobots container, NOT over the host's
# loopback. deploy-unraid.sh puts the container on the `cafepurr` docker
# network, so port 3000 is not necessarily published to the host at all -- an
# earlier version of this script defaulted to http://127.0.0.1:3000 and died
# with "Failed to connect to 127.0.0.1 port 3000". Inside the container that
# address is always right; it is what the image's own HEALTHCHECK uses.
#
# Running inside also means the credential never moves: authGuard.ts accepts
# BETA_ADMIN_TOKEN / ADMIN_TOKEN, docker already loaded them from the env file,
# so the request reads them from its own process.env. Nothing is typed, nothing
# is passed in, nothing lands in shell history or in `ps`.
#
# It uses node:http rather than fetch deliberately: undici caps headersTimeout
# at 5 minutes, and a whole-archive scan can legitimately exceed that before it
# answers. node:http with no timeout set waits as long as the server takes.
#
# USAGE
#   scripts/art-archive-ingest.sh                 # dry run, writes nothing
#   scripts/art-archive-ingest.sh --import        # perform the real import
#
#   --container <name>   default KindRobots, or $KIND_ROBOTS_CONTAINER
#   --url <base>         talk HTTP to a reachable host instead of docker exec,
#                        e.g. --url https://kindrobots.org (needs a token:
#                        $KR_API_TOKEN / $BETA_ADMIN_TOKEN / $ADMIN_TOKEN, or
#                        --token, or the deploy env file)
set -Eeuo pipefail

APP_DIR="${KIND_ROBOTS_APP_DIR:-/mnt/user/appdata/kind_robots}"
ENV_FILE="${KIND_ROBOTS_ENV_FILE:-$APP_DIR/.env}"
CONTAINER="${KIND_ROBOTS_CONTAINER:-KindRobots}"
BASE_URL="${KIND_ROBOTS_URL:-}"
TOKEN=''
ENDPOINT='dry-run'
MODE='Dry run'

while [[ $# -gt 0 ]]; do
  case "$1" in
    --import) ENDPOINT='import'; MODE='Import'; shift ;;
    --dry-run) ENDPOINT='dry-run'; MODE='Dry run'; shift ;;
    --container) CONTAINER="${2:-}"; shift 2 ;;
    --token) TOKEN="${2:-}"; shift 2 ;;
    --url) BASE_URL="${2:-}"; shift 2 ;;
    --env-file) ENV_FILE="${2:-}"; shift 2 ;;
    -h|--help) sed -n '2,46p' "$0"; exit 0 ;;
    *) printf 'Unknown argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done

# The request itself, run wherever the app is. Reads its own credential from
# the environment it is already running in.
REQUEST_JS=$(cat <<'NODE'
import http from 'node:http'
import https from 'node:https'

const base = process.env.KR_INGEST_URL || 'http://127.0.0.1:3000'
const endpoint = process.env.KR_INGEST_ENDPOINT
const token = (
  process.env.KR_INGEST_TOKEN ||
  process.env.BETA_ADMIN_TOKEN ||
  process.env.ADMIN_TOKEN ||
  process.env.KR_API_TOKEN ||
  ''
).trim()

if (!token) {
  process.stderr.write('no admin token in this environment\n')
  process.exit(3)
}

const target = new URL(`/api/admin/art-archive/${endpoint}`, base)
const transport = target.protocol === 'https:' ? https : http

// No timeout is set anywhere on purpose: the scan walks the whole archive
// before the server sends a single header, and aborting would only restart it.
const request = transport.request(
  target,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  },
  (response) => {
    let body = ''
    response.setEncoding('utf8')
    response.on('data', (chunk) => { body += chunk })
    response.on('end', () => {
      process.stdout.write(body)
      process.exit(response.statusCode && response.statusCode < 400 ? 0 : 1)
    })
  },
)

request.on('error', (error) => {
  process.stderr.write(`request failed: ${error.message}\n`)
  process.exit(4)
})
request.end()
NODE
)

run_in_container() {
  command -v docker >/dev/null 2>&1 || return 10
  docker inspect "$CONTAINER" >/dev/null 2>&1 || return 11
  printf '%s' "$REQUEST_JS" | docker exec -i \
    -e KR_INGEST_ENDPOINT="$ENDPOINT" \
    "$CONTAINER" node --input-type=module -
}

# Reads one KEY from an env file without sourcing it. That file holds the
# production DATABASE_URL; it is read, never run.
read_env_key() {
  local key="$1" file="$2"
  [[ -r "$file" ]] || return 1
  sed -n "s/^[[:space:]]*\(export[[:space:]]\+\)\?${key}=//p" "$file" \
    | tail -n 1 \
    | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'\$/\1/"
}

resolve_host_token() {
  [[ -n "$TOKEN" ]] && return 0
  TOKEN="${KR_API_TOKEN:-${BETA_ADMIN_TOKEN:-${ADMIN_TOKEN:-}}}"
  [[ -n "$TOKEN" ]] && return 0
  local key
  for key in BETA_ADMIN_TOKEN ADMIN_TOKEN KR_API_TOKEN; do
    TOKEN="$(read_env_key "$key" "$ENV_FILE" || true)"
    [[ -n "$TOKEN" ]] && return 0
  done
  return 1
}

run_over_http() {
  if ! resolve_host_token; then
    printf 'ERROR: --url needs an admin token.\n' >&2
    printf '  Looked for BETA_ADMIN_TOKEN / ADMIN_TOKEN / KR_API_TOKEN in the\n' >&2
    printf '  environment and in %s\n' "$ENV_FILE" >&2
    printf '  Pass --env-file <path> or --token <value>.\n' >&2
    exit 2
  fi
  KR_INGEST_URL="$BASE_URL" KR_INGEST_ENDPOINT="$ENDPOINT" KR_INGEST_TOKEN="$TOKEN" \
    node --input-type=module -e "$REQUEST_JS"
}

if [[ -n "$BASE_URL" ]]; then
  printf '%s against %s -- no client timeout; a large archive legitimately takes a while.\n' \
    "$MODE" "$BASE_URL" >&2
  response="$(run_over_http)"
else
  printf '%s inside container %s -- no client timeout; a large archive legitimately takes a while.\n' \
    "$MODE" "$CONTAINER" >&2
  set +e
  response="$(run_in_container)"
  status=$?
  set -e
  case "$status" in
    0) ;;
    10) printf 'ERROR: docker is not available here. Pass --url to reach the app over HTTP instead.\n' >&2; exit 2 ;;
    11) printf "ERROR: container '%s' not found. Pass --container <name> or --url <base>.\n" "$CONTAINER" >&2; exit 2 ;;
    *) printf '%s\n' "$response" >&2; exit "$status" ;;
  esac
fi

# Print the whole payload for the record, then the numbers worth reading. The
# resourceMatches array is per-file and long, so it is summarised, not dumped.
if command -v jq >/dev/null 2>&1; then
  printf '%s\n' "$response" | jq 'del(.data.resourceMatches)'
  printf '\n-- summary --\n'
  printf '%s\n' "$response" | jq -r '
    .data
    | to_entries
    | map(select(.value | type != "array" and type != "object"))
    | map("\(.key): \(.value)")
    | .[]'
  printf '%s\n' "$response" | jq -r '.data.plan // empty | to_entries | map("plan.\(.key): \(.value)") | .[]'
  printf '%s\n' "$response" | jq -r '.data.confidenceCounts // empty | to_entries | map("match.\(.key): \(.value)") | .[]'
  printf '%s\n' "$response" | jq -r '
    if (.data.errors // []) | length > 0
    then "FAILED FILES: \((.data.errors | length))"
    else empty end'
else
  printf '%s\n' "$response"
  printf '\n(install jq for a readable summary)\n' >&2
fi
