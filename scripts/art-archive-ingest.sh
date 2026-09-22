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
# This drives the SAME admin endpoints from the host, so the work happens in the
# already-deployed server against the real /app/private mount, with no client
# timeout and nothing to keep open. It needs no repo build and no node_modules:
# the runtime image ships only .output, so the TypeScript CLIs under utils/
# cannot run inside the container at all.
#
# USAGE
#   scripts/art-archive-ingest.sh                 # dry run, writes nothing
#   scripts/art-archive-ingest.sh --import        # perform the real import
#
# AUTH -- NOTHING TO TYPE
#   The token comes from the same env file the deploy already reads
#   ($KIND_ROBOTS_APP_DIR/.env, default /mnt/user/appdata/kind_robots/.env),
#   because the running server authenticates it from that very file:
#   authGuard.ts accepts BETA_ADMIN_TOKEN / ADMIN_TOKEN as an admin bearer.
#   So on Alexandria this is just:
#
#       scripts/art-archive-ingest.sh
#
#   Precedence, first hit wins:
#     --token <value>
#     $KR_API_TOKEN / $BETA_ADMIN_TOKEN / $ADMIN_TOKEN already exported
#     BETA_ADMIN_TOKEN= / ADMIN_TOKEN= in the env file
#   The token is never printed and never placed in argv, so it stays out of
#   shell history and out of `ps` for other users on the box.
#
# TARGET
#   Defaults to the container on this host. Override for a remote target:
#     KIND_ROBOTS_URL=https://kindrobots.org scripts/art-archive-ingest.sh
set -Eeuo pipefail

APP_DIR="${KIND_ROBOTS_APP_DIR:-/mnt/user/appdata/kind_robots}"
ENV_FILE="${KIND_ROBOTS_ENV_FILE:-$APP_DIR/.env}"
BASE_URL="${KIND_ROBOTS_URL:-http://127.0.0.1:3000}"
TOKEN=''
ENDPOINT='dry-run'
MODE='Dry run'

while [[ $# -gt 0 ]]; do
  case "$1" in
    --import) ENDPOINT='import'; MODE='Import'; shift ;;
    --dry-run) ENDPOINT='dry-run'; MODE='Dry run'; shift ;;
    --token) TOKEN="${2:-}"; shift 2 ;;
    --url) BASE_URL="${2:-}"; shift 2 ;;
    --env-file) ENV_FILE="${2:-}"; shift 2 ;;
    -h|--help) sed -n '2,42p' "$0"; exit 0 ;;
    *) printf 'Unknown argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done

# Read one KEY from an env file without sourcing it. Sourcing would execute
# whatever else is in there -- this file holds the production DATABASE_URL, so
# it is read, never run. Handles optional `export `, optional quotes, comments.
read_env_key() {
  local key="$1" file="$2"
  [[ -r "$file" ]] || return 1
  sed -n "s/^[[:space:]]*\(export[[:space:]]\+\)\?${key}=//p" "$file" \
    | tail -n 1 \
    | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'\$/\1/"
}

if [[ -z "$TOKEN" ]]; then
  TOKEN="${KR_API_TOKEN:-${BETA_ADMIN_TOKEN:-${ADMIN_TOKEN:-}}}"
fi

if [[ -z "$TOKEN" ]]; then
  for key in BETA_ADMIN_TOKEN ADMIN_TOKEN KR_API_TOKEN; do
    TOKEN="$(read_env_key "$key" "$ENV_FILE" || true)"
    [[ -n "$TOKEN" ]] && break
  done
fi

if [[ -z "$TOKEN" ]]; then
  printf 'ERROR: no admin token.\n' >&2
  printf '  Looked for BETA_ADMIN_TOKEN / ADMIN_TOKEN / KR_API_TOKEN in the\n' >&2
  printf '  environment and in %s\n' "$ENV_FILE" >&2
  printf '  Pass --env-file <path> if the deploy env lives elsewhere, or\n' >&2
  printf '  --token <value> to supply one directly.\n' >&2
  exit 2
fi

printf '%s against %s -- no client timeout; a large archive legitimately takes a while.\n' \
  "$MODE" "$BASE_URL" >&2

# The token goes in via a curl config on stdin rather than -H, so it never
# appears in this process's argv. --max-time 0 removes curl's own cap; the scan
# is the long pole and a retry would restart it from the beginning, so this
# never retries.
response="$(
  printf 'header = "Authorization: Bearer %s"\n' "$TOKEN" \
    | curl -sS --fail-with-body --max-time 0 \
        -X POST "$BASE_URL/api/admin/art-archive/$ENDPOINT" \
        -H 'Content-Type: application/json' \
        -K -
)"

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
