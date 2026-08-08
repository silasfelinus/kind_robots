#!/usr/bin/env bash
# Tighten the generated coding-agent DATABASE_URL without rotating credentials.
# Run after scripts/provision-agent-db-lane.sh --apply.

set -Eeuo pipefail

OUTPUT_FILE="${OUTPUT_FILE:-/mnt/user/pc/kindrobots-db-agent/kindrobots-db-agent.env}"
AGENT_CLIENT_CONNECTION_LIMIT="${AGENT_CLIENT_CONNECTION_LIMIT:-3}"
AGENT_CLIENT_MINIMUM_IDLE="${AGENT_CLIENT_MINIMUM_IDLE:-0}"
AGENT_CLIENT_IDLE_TIMEOUT_SECONDS="${AGENT_CLIENT_IDLE_TIMEOUT_SECONDS:-30}"
AGENT_CLIENT_ACQUIRE_TIMEOUT_MS="${AGENT_CLIENT_ACQUIRE_TIMEOUT_MS:-10000}"
AGENT_CLIENT_CONNECT_TIMEOUT_MS="${AGENT_CLIENT_CONNECT_TIMEOUT_MS:-5000}"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

command -v node >/dev/null 2>&1 || fail 'node is required to tune the agent database URL'
[[ -f "$OUTPUT_FILE" ]] || fail "credential handoff file not found: $OUTPUT_FILE"

mode="$(stat -c '%a' "$OUTPUT_FILE" 2>/dev/null || true)"
[[ "$mode" == '600' || "$mode" == '400' ]] || fail \
  "refusing to read $OUTPUT_FILE because its mode is ${mode:-unknown}; chmod 600 first"

for value in \
  "$AGENT_CLIENT_CONNECTION_LIMIT" \
  "$AGENT_CLIENT_MINIMUM_IDLE" \
  "$AGENT_CLIENT_IDLE_TIMEOUT_SECONDS" \
  "$AGENT_CLIENT_ACQUIRE_TIMEOUT_MS" \
  "$AGENT_CLIENT_CONNECT_TIMEOUT_MS"; do
  [[ "$value" =~ ^[0-9]+$ ]] || fail "expected an integer, got: $value"
done

[[ "$AGENT_CLIENT_CONNECTION_LIMIT" -ge 1 ]] || fail 'Agent client connection limit must be at least 1'
[[ "$AGENT_CLIENT_CONNECTION_LIMIT" -le 6 ]] || fail 'Agent client connection limit must not exceed the default six-backend agent lane'
[[ "$AGENT_CLIENT_MINIMUM_IDLE" -le "$AGENT_CLIENT_CONNECTION_LIMIT" ]] || fail \
  'Agent minimum idle must not exceed its connection limit'
[[ "$AGENT_CLIENT_IDLE_TIMEOUT_SECONDS" -ge 1 ]] || fail 'Agent idle timeout must be at least one second'
[[ "$AGENT_CLIENT_ACQUIRE_TIMEOUT_MS" -gt "$AGENT_CLIENT_CONNECT_TIMEOUT_MS" ]] || fail \
  'Agent acquire timeout must exceed its connect timeout'

OUTPUT_FILE="$OUTPUT_FILE" \
AGENT_CLIENT_CONNECTION_LIMIT="$AGENT_CLIENT_CONNECTION_LIMIT" \
AGENT_CLIENT_MINIMUM_IDLE="$AGENT_CLIENT_MINIMUM_IDLE" \
AGENT_CLIENT_IDLE_TIMEOUT_SECONDS="$AGENT_CLIENT_IDLE_TIMEOUT_SECONDS" \
AGENT_CLIENT_ACQUIRE_TIMEOUT_MS="$AGENT_CLIENT_ACQUIRE_TIMEOUT_MS" \
AGENT_CLIENT_CONNECT_TIMEOUT_MS="$AGENT_CLIENT_CONNECT_TIMEOUT_MS" \
node --input-type=module <<'NODE'
import { chmodSync, readFileSync, renameSync, writeFileSync } from 'node:fs'

const outputFile = process.env.OUTPUT_FILE
if (!outputFile) throw new Error('OUTPUT_FILE is missing')

const source = readFileSync(outputFile, 'utf8')
const match = source.match(/^AGENT_DATABASE_URL=(.+)$/m)
if (!match?.[1]) throw new Error('AGENT_DATABASE_URL is missing from the handoff file')

const url = new URL(match[1])
url.searchParams.set('connectionLimit', process.env.AGENT_CLIENT_CONNECTION_LIMIT ?? '3')
url.searchParams.set('minimumIdle', process.env.AGENT_CLIENT_MINIMUM_IDLE ?? '0')
url.searchParams.set('idleTimeout', process.env.AGENT_CLIENT_IDLE_TIMEOUT_SECONDS ?? '30')
url.searchParams.set('acquireTimeout', process.env.AGENT_CLIENT_ACQUIRE_TIMEOUT_MS ?? '10000')
url.searchParams.set('connectTimeout', process.env.AGENT_CLIENT_CONNECT_TIMEOUT_MS ?? '5000')
url.searchParams.set('minDelayValidation', '0')
url.searchParams.set('pipelining', 'false')

const next = source.replace(/^AGENT_DATABASE_URL=.*$/m, `AGENT_DATABASE_URL=${url.toString()}`)
const temporary = `${outputFile}.tmp-${process.pid}`
writeFileSync(temporary, next, { mode: 0o600 })
chmodSync(temporary, 0o600)
renameSync(temporary, outputFile)
chmodSync(outputFile, 0o600)
NODE

printf 'Agent DATABASE_URL pool tuning applied to %s (contents not printed).\n' "$OUTPUT_FILE"
printf 'Client pool: connectionLimit=%s minimumIdle=%s idleTimeout=%ss acquireTimeout=%sms connectTimeout=%sms pipelining=false\n' \
  "$AGENT_CLIENT_CONNECTION_LIMIT" \
  "$AGENT_CLIENT_MINIMUM_IDLE" \
  "$AGENT_CLIENT_IDLE_TIMEOUT_SECONDS" \
  "$AGENT_CLIENT_ACQUIRE_TIMEOUT_MS" \
  "$AGENT_CLIENT_CONNECT_TIMEOUT_MS"
printf 'Use the resulting AGENT_DATABASE_URL as Claude\x27s DATABASE_URL.\n'
