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
# AUTH
#   Needs an admin bearer token, from either:
#     export KIND_ROBOTS_ADMIN_TOKEN=...          # or --token <value>
#   An admin's API token is the same one the browser sends; read it from the
#   User row, or copy it out of the logged-in browser session.
#
# TARGET
#   Defaults to the container on this host. Override for a remote target:
#     KIND_ROBOTS_URL=https://kindrobots.org scripts/art-archive-ingest.sh
set -Eeuo pipefail

BASE_URL="${KIND_ROBOTS_URL:-http://127.0.0.1:3000}"
TOKEN="${KIND_ROBOTS_ADMIN_TOKEN:-}"
ENDPOINT='dry-run'
MODE='Dry run'

while [[ $# -gt 0 ]]; do
  case "$1" in
    --import) ENDPOINT='import'; MODE='Import'; shift ;;
    --dry-run) ENDPOINT='dry-run'; MODE='Dry run'; shift ;;
    --token) TOKEN="${2:-}"; shift 2 ;;
    --url) BASE_URL="${2:-}"; shift 2 ;;
    -h|--help) sed -n '2,32p' "$0"; exit 0 ;;
    *) printf 'Unknown argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done

if [[ -z "$TOKEN" ]]; then
  printf 'ERROR: no admin token. Set KIND_ROBOTS_ADMIN_TOKEN or pass --token <value>.\n' >&2
  exit 2
fi

printf '%s against %s -- no client timeout; a large archive legitimately takes a while.\n' \
  "$MODE" "$BASE_URL" >&2

# --max-time 0 removes curl's own cap. The scan is the long pole, and a retry
# would restart it from the beginning, so this never retries.
response="$(curl -sS --fail-with-body --max-time 0 \
  -X POST "$BASE_URL/api/admin/art-archive/$ENDPOINT" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json')"

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
