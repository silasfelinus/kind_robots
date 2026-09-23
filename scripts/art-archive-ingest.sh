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
# BETA_ADMIN_TOKEN / ADMIN_TOKEN, and the exec'd node loads them from the same
# place the app itself does. Nothing is typed, nothing is passed in, nothing
# lands in shell history or in `ps`.
#
# That place is /config/kind-robots.env INSIDE the container, not the docker
# environment. The Dockerfile CMD is
#   node --env-file-if-exists=/config/kind-robots.env .output/server/index.mjs
# so it is node, at startup, that reads the config -- and deploy-unraid.sh only
# passes --env-file to the one-shot migration container, never to the app, which
# DockerMan recreates from its Unraid template. A `docker exec node` is a fresh
# process: it inherits the container's docker-level env, which does not contain
# the token, and it does not inherit whatever the running server read from a
# file. The first version of this got exactly that wrong and reported
# "no admin token in this environment". The exec below repeats the CMD's flag so
# the request sees the same config the server sees.
#
# It uses node:http rather than fetch deliberately: undici caps headersTimeout
# at 5 minutes, and a whole-archive scan can legitimately exceed that before it
# answers. node:http with no timeout set waits as long as the server takes.
#
# USAGE
#   scripts/art-archive-ingest.sh --local-scan    # how many files are there,
#                                                 # counted on this host; needs
#                                                 # no API and no deploy
#   scripts/art-archive-ingest.sh                 # how many files, how many
#                                                 # left; reads no images
#   scripts/art-archive-ingest.sh --import        # resumable batched import,
#                                                 # reporting after each batch
#   scripts/art-archive-ingest.sh --status        # same counts as the default
#
#   --batch-size N      files per batch (default 250, server caps at 2000)
#   --import-once       the old single-request import; hydrates the whole
#                       archive before writing anything
#   --dry-run-full      the full per-file reconciliation plan, same cost
#
#   --container <name>   default KindRobots, or $KIND_ROBOTS_CONTAINER
#   --container-env-file <path>  in-container config, default
#                        /config/kind-robots.env
#   --url <base>         talk HTTP to a reachable host instead of docker exec,
#                        e.g. --url https://kindrobots.org (needs a token:
#                        $KR_API_TOKEN / $BETA_ADMIN_TOKEN / $ADMIN_TOKEN, or
#                        --token, or the deploy env file)
set -Eeuo pipefail

APP_DIR="${KIND_ROBOTS_APP_DIR:-/mnt/user/appdata/kind_robots}"
ENV_FILE="${KIND_ROBOTS_ENV_FILE:-$APP_DIR/.env}"
CONTAINER="${KIND_ROBOTS_CONTAINER:-KindRobots}"
# Path INSIDE the container, matching the Dockerfile CMD.
CONTAINER_ENV_FILE="${KIND_ROBOTS_CONTAINER_ENV_FILE:-/config/kind-robots.env}"
BASE_URL="${KIND_ROBOTS_URL:-}"
TOKEN=''
REQUEST_PATH='/api/admin/art-archive/scan-status'
REQUEST_METHOD='GET'
MODE='Dry run'
BATCH=0
BACKFILL=0
BACKFILL_APPLY=0
BATCH_LIMIT="${KIND_ROBOTS_BATCH_SIZE:-250}"
LOCAL_SCAN=0
# The host side of the mount the container sees as /app/private.
ARCHIVE_PATH="${KIND_ROBOTS_ARCHIVE_PATH:-/mnt/user/pc/kindrobots/private}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    # Resumable by default: the server treats an existing ArchiveEntry row as
    # "done", so this walks the archive in batches, reports after each one, and
    # continues where it left off if it is interrupted.
    --import)
      REQUEST_PATH='/api/admin/art-archive/import-batch'; REQUEST_METHOD='POST'
      BATCH=1; MODE='Import'; shift ;;
    --batch-size) BATCH_LIMIT="${2:-}"; shift 2 ;;
    # Fills in BOTH values the import lost, reading each file's real metadata
    # back out of ArchiveEntry.extractedMetadata: the seed dropped while
    # ArtImage.seed was a SIGNED column, and the CFG dropped because a half
    # step (12.5) does not fit an Int without the cfgHalf flag.
    # Reports without writing unless --apply is also given. Batched and
    # resumable like --import; a filled seed is never rewritten, so this is
    # safe to re-run and safe to interrupt.
    --backfill-seeds)
      REQUEST_PATH='/api/admin/art-archive/backfill-seeds'; REQUEST_METHOD='POST'
      BACKFILL=1; MODE='Backfill seed + CFG (dry run)'; shift ;;
    --apply)
      BACKFILL_APPLY=1
      [[ "$MODE" == 'Backfill seed + CFG (dry run)' ]] && MODE='Backfill seed + CFG (writing)'
      shift ;;
    # The whole archive in one request, hydrating every file before it answers.
    # Fine for a small archive; for the real one it is the request that never
    # came back. Kept because it is the only thing that reports the full
    # per-file reconciliation plan.
    --import-once)
      REQUEST_PATH='/api/admin/art-archive/import'; REQUEST_METHOD='POST'
      MODE='Import (single request)'; shift ;;
    --dry-run)
      REQUEST_PATH='/api/admin/art-archive/scan-status'; REQUEST_METHOD='GET'
      MODE='Dry run'; shift ;;
    --dry-run-full)
      REQUEST_PATH='/api/admin/art-archive/dry-run'; REQUEST_METHOD='POST'
      MODE='Dry run (full reconciliation)'; shift ;;
    # Reads what is actually in the database right now. Scans nothing, writes
    # nothing -- the fastest way to answer "did the import land?" without
    # walking the archive again.
    --status)
      REQUEST_PATH='/api/admin/art-archive/scan-status'
      REQUEST_METHOD='GET'; MODE='Status'; shift ;;
    # Answers "how big is this actually" from the host filesystem: no API, no
    # container, no deploy. Mirrors the scanner's own rules so the number means
    # the same thing the importer will see.
    --local-scan) LOCAL_SCAN=1; shift ;;
    --archive-path) ARCHIVE_PATH="${2:-}"; shift 2 ;;
    --container) CONTAINER="${2:-}"; shift 2 ;;
    --container-env-file) CONTAINER_ENV_FILE="${2:-}"; shift 2 ;;
    --token) TOKEN="${2:-}"; shift 2 ;;
    --url) BASE_URL="${2:-}"; shift 2 ;;
    --env-file) ENV_FILE="${2:-}"; shift 2 ;;
    -h|--help) sed -n '2,60p' "$0"; exit 0 ;;
    *) printf 'Unknown argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done

# Counted here rather than through the app, so it works before any deploy and
# cannot be affected by whatever the API is doing. The rules are the scanner's:
# these four extensions, no dotfiles or dotdirs, and never the trash subtree
# (server/utils/artArchiveScanner.ts, artArchiveFileOps.ts).
run_local_scan() {
  if [[ ! -d "$ARCHIVE_PATH" ]]; then
    printf 'ERROR: %s is not a directory on this host.\n' "$ARCHIVE_PATH" >&2
    printf '  Pass --archive-path <path> if the archive lives elsewhere.\n' >&2
    exit 2
  fi

  printf 'Counting %s -- no API, no container. This walks the tree, so it takes a moment.\n' \
    "$ARCHIVE_PATH" >&2

  find "$ARCHIVE_PATH" \
    -name '.*' -prune -o \
    -type d -name '_archive_trash' -prune -o \
    -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' \) -print0 \
    | awk -v RS='\0' '
        {
          total += 1
          n = split($0, parts, "/")
          name = parts[n]
          ext = tolower(name)
          sub(/.*\./, "", ext)
          byExt[ext] += 1
          dir = $0
          sub(/\/[^\/]*$/, "", dir)
          if (!(dir in seenDir)) { seenDir[dir] = 1; dirs += 1 }
        }
        END {
          printf "files: %d\n", total
          printf "folders holding them: %d\n", dirs
          for (e in byExt) printf "  .%s: %d\n", e, byExt[e]
        }'

  printf '\napparent size on disk:\n' >&2
  du -sh "$ARCHIVE_PATH" 2>/dev/null || true
}

# The request itself, run wherever the app is. Reads its own credential from
# the environment it is already running in.
REQUEST_JS=$(cat <<'NODE'
import http from 'node:http'
import https from 'node:https'

const base = process.env.KR_INGEST_URL || 'http://127.0.0.1:3000'
const path = process.env.KR_INGEST_PATH
const method = process.env.KR_INGEST_METHOD || 'POST'
const token = (
  process.env.KR_INGEST_TOKEN ||
  process.env.BETA_ADMIN_TOKEN ||
  process.env.ADMIN_TOKEN ||
  process.env.KR_API_TOKEN ||
  ''
).trim()

if (!token) {
  process.stderr.write(
    'no admin token in this environment -- expected BETA_ADMIN_TOKEN or ' +
      'ADMIN_TOKEN, normally loaded from /config/kind-robots.env\n',
  )
  process.exit(3)
}

// No timeout is set anywhere on purpose: a request can legitimately take a
// while, and aborting it would only restart the work.
function sendOnce(requestPath, requestMethod, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(requestPath, base)
    const body = payload === undefined ? null : JSON.stringify(payload)
    const call = (url.protocol === 'https:' ? https : http).request(
      url,
      {
        method: requestMethod,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        },
      },
      (response) => {
        let text = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => { text += chunk })
        response.on('end', () => {
          const code = response.statusCode ?? 0
          const contentType = String(response.headers['content-type'] || '')
          if (code >= 200 && code < 400) {
            // A 2xx is not proof the endpoint exists. Nuxt serves the app's
            // HTML for a route its build does not know, so an out-of-date
            // container answers 200 with a web page and the caller's jq dies
            // on "Invalid numeric literal" with nothing to act on
            // (art-archive/t-041, 2026-09-23).
            if (!contentType.includes('json')) {
              process.stderr.write(
                `${requestMethod} ${url} answered ${code} with ` +
                  `${contentType || 'no content-type'}, not JSON.\n`,
              )
              process.stderr.write(
                text.trim().startsWith('<')
                  ? 'That is an HTML page, which usually means the running ' +
                      'build does not have this endpoint yet -- deploy the ' +
                      'current image, or use --local-scan, which needs no API.\n'
                  : `${text.trim().slice(0, 300)}\n`,
              )
              process.exit(8)
            }
            return resolve(text)
          }
          // An empty error body used to produce no output anywhere, so a
          // failed run looked identical to a successful silent one.
          process.stderr.write(`HTTP ${code} from ${requestMethod} ${url}\n`)
          const preview = text.trim()
          process.stderr.write(
            preview ? `${preview.slice(0, 2000)}\n` : '(empty response body)\n',
          )
          process.exit(5)
        })
      },
    )
    call.on('error', reject)
    if (body) call.write(body)
    call.end()
  })
}

// An app that stops answering mid-import is a PAUSE, not an end.
//
// The first full run died at batch 68 of ~964 -- 19,156 of 240,856 files, 8% --
// with `connect ECONNREFUSED 127.0.0.1:3000`: nothing listening, so the app
// process had gone away (art-archive/t-041, 2026-09-23; an earlier run ended in
// an unexplained exit 137, which is the same shape). Why it went away is not
// established and is NOT guessed at here.
//
// What is certain is that giving up was the wrong response. The resume state is
// the database, so the ~19,000 files already imported stay imported and a retry
// continues from there; and retrying a batch is safe even mid-flight, because
// importArchiveFile() is per-file transactional and keyed on relativePath, so a
// file imported twice is an update, not a duplicate. Waiting for the app to
// come back therefore costs nothing and saves the whole run.
const RETRY_BACKOFF_MS = [2000, 4000, 8000, 16000, 30000, 30000, 30000, 30000, 30000, 30000]

function isTransientConnection(error) {
  const code = error?.code
  return (
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    code === 'EPIPE' ||
    code === 'ETIMEDOUT' ||
    code === 'EHOSTUNREACH' ||
    /socket hang up/i.test(String(error?.message ?? ''))
  )
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function request(requestPath, requestMethod, payload) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await sendOnce(requestPath, requestMethod, payload)
    } catch (error) {
      if (!isTransientConnection(error) || attempt >= RETRY_BACKOFF_MS.length) {
        throw error
      }
      const wait = RETRY_BACKOFF_MS[attempt]
      process.stderr.write(
        `  .. app unreachable (${error.code ?? error.message}); waiting ` +
          `${wait / 1000}s for it to come back, then retrying. Nothing is ` +
          `lost -- imported files stay imported.\n`,
      )
      await sleep(wait)
    }
  }
}

function fail(error) {
  process.stderr.write(`request failed: ${error.message}\n`)
  if (isTransientConnection(error)) {
    process.stderr.write(
      'The app never came back after several minutes of retrying, so it is ' +
        'down rather than restarting. Nothing is lost: re-run this script ' +
        'once it is up and the import continues where it stopped.\n',
    )
  }
  process.exit(4)
}

// Batch mode: keep asking for the next slice until nothing is pending, and
// say where we are after every one. The server holds the resume state (a file
// is done when its ArchiveEntry row exists), so stopping here and re-running
// later continues rather than restarting.
// Backfill mode: walk the ledger in batches, filling seeds from each entry's
// stored metadata. Same resume shape as the import -- the server returns the
// next cursor, so stopping and re-running continues rather than restarting.
if (process.env.KR_INGEST_BACKFILL === '1') {
  const apply = process.env.KR_INGEST_BACKFILL_APPLY === '1'
  const limit = Number(process.env.KR_INGEST_BATCH_LIMIT || 500)
  const started = Date.now()
  let cursor = 0
  let batches = 0
  let scanned = 0
  let seeds = 0
  let cfgs = 0
  let applied = 0
  let stillUnknown = 0
  let noMetadata = 0
  let notPng = 0
  let noGenBlock = 0
  let seedAbsent = 0
  let cfgAbsent = 0

  for (;;) {
    const raw = await request(path, 'POST', { cursor, limit, apply })
    const data = JSON.parse(raw)
    if (data.success === false) {
      process.stderr.write(`${data.message || 'backfill failed'}\n`)
      process.exit(5)
    }

    batches += 1
    scanned += data.scanned || 0
    seeds += data.seedsRecoverable || 0
    cfgs += data.cfgRecoverable || 0
    applied += data.applied || 0
    stillUnknown += data.stillUnknown || 0
    noMetadata += data.noMetadataStored || 0
    notPng += data.notPngOrUnsupported || 0
    noGenBlock += data.noGenerationBlock || 0
    seedAbsent += data.seedAbsentFromMetadata || 0
    cfgAbsent += data.cfgAbsentFromMetadata || 0
    cursor = data.cursor ?? cursor

    const elapsed = Math.round((Date.now() - started) / 1000)
    process.stderr.write(
      `[batch ${batches}] entry #${cursor}: ${seeds} seed(s) + ${cfgs} cfg(s) ` +
        `recoverable, ${applied} row(s) written, ${stillUnknown} had neither ` +
        `in their metadata, ${elapsed}s elapsed\n`,
    )

    if (data.done) break
  }

  process.stderr.write(
    `\n${scanned} ledger row(s) walked. ${seeds} seed(s) and ${cfgs} cfg ` +
      `value(s) recoverable from extractedMetadata; ${stillUnknown} row(s) ` +
      `carried neither.\n`,
  )

  // Say WHY nothing came back, so a zero is an answer rather than a mystery.
  if (stillUnknown) {
    process.stderr.write(
      `  of those: ${seedAbsent} parsed fine but carried no usable Seed, ` +
        `${cfgAbsent} parsed fine but carried no usable CFG, ${noGenBlock} ` +
        `had no generation block at all (a screenshot, a download, stripped ` +
        `metadata), ${notPng} were not a readable PNG, ${noMetadata} had ` +
        `nothing stored.\n`,
    )
  }

  if (!apply && (seeds || cfgs)) {
    process.stderr.write(
      'Nothing was written. Re-run with --apply to fill them in.\n',
    )
  }
  process.exit(0)
}

if (process.env.KR_INGEST_BATCH === '1') {
  const limit = Number(process.env.KR_INGEST_BATCH_LIMIT || 250)
  const started = Date.now()
  let batches = 0
  let completedTotal = 0
  let last = null

  for (;;) {
    let payload
    try {
      payload = JSON.parse(await request(path, 'POST', { limit }))
    } catch (error) {
      fail(error)
    }
    const data = payload?.data
    if (!data) {
      process.stderr.write('batch response carried no data; stopping.\n')
      process.exit(6)
    }

    batches += 1
    completedTotal += data.completed ?? 0
    last = data

    const elapsed = Math.round((Date.now() - started) / 1000)
    const doneSoFar = data.filesOnDisk - data.remaining
    const percent = data.filesOnDisk
      ? ((doneSoFar / data.filesOnDisk) * 100).toFixed(1)
      : '0.0'
    process.stderr.write(
      `[batch ${batches}] ${doneSoFar}/${data.filesOnDisk} (${percent}%) ` +
        `+${data.completed} this pass, ${data.remaining} left, ${elapsed}s elapsed` +
        (data.errors?.length ? `, ${data.errors.length} failed` : '') +
        // Printed every batch on purpose: one reading says nothing, a column
        // of them across 900 batches says whether the app's memory climbs.
        (data.memoryRssMb ? `, app rss ${data.memoryRssMb}MB` : '') +
        '\n',
    )

    // Five samples out of 908 says nothing about whether they share a cause.
    // Collapse to one line per distinct failure, with a count and one example,
    // so a single systemic fault reads as one systemic fault.
    if (data.errors?.length) {
      const byKind = new Map()
      for (const failure of data.errors) {
        const kind = String(failure.message)
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 160)
        const seen = byKind.get(kind)
        if (seen) seen.count += 1
        else byKind.set(kind, { count: 1, example: failure.relativePath })
      }
      for (const [kind, { count, example }] of [...byKind.entries()].sort(
        (a, b) => b[1].count - a[1].count,
      )) {
        process.stderr.write(`  ! ${count}x ${kind}\n      e.g. ${example}\n`)
      }
    }

    // Two different faults, never merged into one line: a value too big for the
    // column is not the same finding as a value that was never a whole number,
    // and calling a `CFG scale: 7.5` "too large" is just false. The magnitude
    // is printed because it is the evidence -- ~4e9 means unsigned 32-bit
    // A1111 seeds, ~1e18 means ComfyUI and a wider column is not optional.
    for (const [field, drop] of Object.entries(data.droppedFields ?? {})) {
      const parts = []
      if (drop.outOfRange) {
        parts.push(
          `${drop.outOfRange} outside the column range (largest ${drop.largestMagnitude})`,
        )
      }
      if (drop.notAnInteger) parts.push(`${drop.notAnInteger} not whole numbers`)
      if (!parts.length) continue
      process.stderr.write(
        `  ~ ${field}: ${parts.join(', ')}; stored null, true value kept in ` +
          `the entry metadata\n      e.g. ${drop.exampleValue} in ${drop.examplePath}\n`,
      )
    }

    if (data.done) {
      // The cursor reached the end of the listing. That is not the same as
      // everything being imported: a batch whose files all failed advances past
      // them, so say so rather than printing a clean finish.
      if (data.skippedThisRun) {
        process.stderr.write(
          `reached the end of the listing with ${data.remaining} file(s) still ` +
            'not imported -- they failed this run. Run again to retry them.\n',
        )
      }
      break
    }
    // A batch that completed nothing cannot make progress by repeating: every
    // file in it failed, or the listing and the database disagree. Stop rather
    // than spin.
    if ((data.completed ?? 0) === 0) {
      process.stderr.write(
        'a full batch completed nothing; stopping so this does not loop forever.\n',
      )
      break
    }
  }

  process.stdout.write(
    JSON.stringify({
      success: true,
      data: { ...last, batches, completedTotal },
    }),
  )
  process.exit(last?.done ? 0 : 7)
}

let single
try {
  single = await request(path, method)
} catch (error) {
  fail(error)
}
process.stdout.write(single)

NODE
)

run_in_container() {
  command -v docker >/dev/null 2>&1 || return 10
  docker inspect "$CONTAINER" >/dev/null 2>&1 || return 11
  printf '%s' "$REQUEST_JS" | docker exec -i \
    -e KR_INGEST_PATH="$REQUEST_PATH" \
    -e KR_INGEST_METHOD="$REQUEST_METHOD" \
    -e KR_INGEST_BATCH="$BATCH" \
    -e KR_INGEST_BATCH_LIMIT="$BATCH_LIMIT" \
    -e KR_INGEST_BACKFILL="$BACKFILL" \
    -e KR_INGEST_BACKFILL_APPLY="$BACKFILL_APPLY" \
    "$CONTAINER" node \
      "--env-file-if-exists=$CONTAINER_ENV_FILE" \
      --input-type=module -
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
  KR_INGEST_URL="$BASE_URL" KR_INGEST_PATH="$REQUEST_PATH" \
    KR_INGEST_METHOD="$REQUEST_METHOD" KR_INGEST_TOKEN="$TOKEN" \
    KR_INGEST_BATCH="$BATCH" KR_INGEST_BATCH_LIMIT="$BATCH_LIMIT" \
    KR_INGEST_BACKFILL="$BACKFILL" KR_INGEST_BACKFILL_APPLY="$BACKFILL_APPLY" \
    node --input-type=module -e "$REQUEST_JS"
}

if [[ "$LOCAL_SCAN" == 1 ]]; then
  run_local_scan
  exit 0
fi

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
    3) printf 'Check %s inside container %s, or pass --container-env-file.\n' \
         "$CONTAINER_ENV_FILE" "$CONTAINER" >&2; exit 3 ;;
    5) printf 'The request reached the app and it refused. See the HTTP status above.\n' >&2
       [[ -n "$response" ]] && printf '%s\n' "$response" >&2
       exit 5 ;;
    4) printf 'Could not reach the app from inside %s. Is it running?\n' "$CONTAINER" >&2; exit 4 ;;
    *) printf 'Failed with exit status %s.\n' "$status" >&2
       [[ -n "$response" ]] && printf '%s\n' "$response" >&2
       exit "$status" ;;
  esac
fi

# The batched modes (--import, --backfill-seeds) drive their own loop and report
# every batch to stderr as it goes, so they legitimately finish with nothing on
# stdout. The empty-body guard below is for a SINGLE request that came back
# hollow, and firing it after a batched run appends a false ERROR to a run that
# actually succeeded -- which is exactly what a completed backfill printed
# (art-archive/t-041, 2026-09-23).
if [[ "$BATCH" == '1' || "$BACKFILL" == '1' ]]; then
  exit 0
fi

# A 2xx that carried nothing is still nothing to report, and must not look like
# a quiet success.
if [[ -z "${response//[[:space:]]/}" ]]; then
  printf 'ERROR: the app answered but sent an empty body. Nothing was reported.\n' >&2
  exit 6
fi

# Print the whole payload for the record, then the numbers worth reading. The
# resourceMatches array is per-file and long, so it is summarised, not dumped.
if command -v jq >/dev/null 2>&1; then
  if ! printf '%s\n' "$response" | jq empty >/dev/null 2>&1; then
    printf 'ERROR: the app answered, but not with JSON. First 300 bytes:\n' >&2
    printf '%.300s\n' "$response" >&2
    exit 8
  fi
  printf '%s\n' "$response" | jq 'del(.data.resourceMatches) | del(.data.entries)'
  printf '\n-- summary --\n'
  printf '%s\n' "$response" | jq -r '
    .data
    | to_entries
    | map(select(.value | type != "array" and type != "object"))
    | map("\(.key): \(.value)")
    | .[]'
  printf '%s\n' "$response" | jq -r '
    if .data.filesOnDisk != null
    then "files on disk: \(.data.filesOnDisk)   imported: \(.data.filesOnDisk - (.data.pending // .data.remaining // 0))   pending: \(.data.pending // .data.remaining)"
    else empty end'
  printf '%s\n' "$response" | jq -r '
    if .data.total != null
    then "ArchiveEntry rows currently in the database: \(.data.total)"
    else empty end'
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
