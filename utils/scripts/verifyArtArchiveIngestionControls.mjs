// /utils/scripts/verifyArtArchiveIngestionControls.mjs
//
// Contract for the admin Art Archive ingestion controls (art-archive/t-040).
//
// WHY
// ---
// dry-run.post.ts and import.post.ts shipped with no caller in the client, so
// the only way to ingest the production archive was a shell on the container.
// The admin page now owns both. Two properties matter enough to pin here: the
// store, not the page, is what talks to the endpoints, and the write endpoint
// is never one click away -- it stays disabled until a dry run has reported
// what would happen, and then takes an explicit confirmation.
//
//   node utils/scripts/verifyArtArchiveIngestionControls.mjs
import fs from 'node:fs'

const store = fs.readFileSync('stores/artArchiveStore.ts', 'utf8')
const page = fs.readFileSync('pages/art-archive.vue', 'utf8')
const tab = fs.readFileSync('content/channels/admin/art-archive.md', 'utf8')

const checks = [
  [
    'store calls the dry-run endpoint',
    store,
    /performFetch<ArchiveDryRunReport>\(\s*'\/api\/admin\/art-archive\/dry-run',\s*\{ method: 'POST' \},/,
  ],
  [
    'store calls the import endpoint',
    store,
    /performFetch<ArchiveImportReport>\(\s*'\/api\/admin\/art-archive\/import',\s*\{ method: 'POST' \},/,
  ],
  [
    'store checks success before storing the dry-run report',
    store,
    /if \(response\.success && response\.data\) dryRunReport\.value = response\.data/,
  ],
  [
    'store checks success before storing the import report',
    store,
    /if \(response\.success && response\.data\) \{\s*importReport\.value = response\.data/,
  ],
  [
    'store refreshes the entry list after a successful import',
    store,
    /if \(response\.success\) await fetchEntries\(true\)/,
  ],
  ['store exposes both ingestion actions', store, /runDryRun, runImport/],
  [
    'page reaches the endpoints only through the store',
    page,
    /archive\.runDryRun\(\)/,
  ],
  ['page imports via the store action', page, /archive\.runImport\(\)/],
  ['page reports the dry-run plan before any write', page, /dryRunStats/],
  ['page reports what the import actually wrote', page, /importStats/],
  [
    'page surfaces per-file import failures',
    page,
    /archive\.importReport\.errors/,
  ],
]

let failed = false
for (const [name, source, pattern] of checks) {
  if (!pattern.test(source)) {
    console.error(`FAIL: ${name}`)
    failed = true
  } else console.log(`PASS: ${name}`)
}

if (/\$fetch\(|useFetch\(/.test(page)) {
  console.error(
    'FAIL: page calls an API directly instead of going through the store',
  )
  failed = true
} else console.log('PASS: page performs no direct API calls')

const importButton = page.match(/<button[^>]*@click="requestImport"[^>]*>/)
if (!importButton) {
  console.error('FAIL: page has no import button bound to requestImport')
  failed = true
} else if (
  !/:disabled="!archive\.dryRunReport \|\| archive\.ingestionPending"/.test(
    importButton[0],
  )
) {
  console.error(
    'FAIL: import button must stay disabled until a dry run has run',
  )
  failed = true
} else console.log('PASS: import button stays disabled until a dry run has run')

if (
  !/function requestImport\(\) \{ if \(archive\.dryRunReport\) pendingImport\.value = true \}/.test(
    page,
  )
) {
  console.error(
    'FAIL: requestImport must only arm the confirmation when a dry-run report exists',
  )
  failed = true
} else
  console.log('PASS: requestImport only arms the confirmation after a dry run')

if (
  !/async function confirmImport\(\) \{ pendingImport\.value = false; await archive\.runImport\(\) \}/.test(
    page,
  )
) {
  console.error(
    'FAIL: the real import must run only from an explicit confirmation step',
  )
  failed = true
} else
  console.log(
    'PASS: the real import runs only from an explicit confirmation step',
  )

// A surface nobody can navigate to is only half-shipped (Silas, 2026-09-20:
// "If the path exists, it should be a nav link in admin channel"). The page
// shipped with no channel registration at all, so nothing in the app linked to
// it and the only way in was typing the URL. Pin both halves: the tab exists,
// and its route is the one the page actually resolves to.
const tabChecks = [
  ['archive tab is registered on the admin channel', /\nchannelKey: admin\n/],
  ['archive tab routes to the page path', /\nroute: \/art-archive\n/],
  ['archive tab is admin-only', /\nrequiredRole: ADMIN\n/],
  ['archive tab is a navigable tab, not a hidden one', /\ncontentType: tab\n/],
]
for (const [name, pattern] of tabChecks) {
  if (!pattern.test(tab)) {
    console.error(`FAIL: ${name}`)
    failed = true
  } else console.log(`PASS: ${name}`)
}

if (fs.existsSync('pages/admin/art-archive.vue')) {
  console.error(
    'FAIL: the old unreachable pages/admin/art-archive.vue is back alongside the routed page',
  )
  failed = true
} else
  console.log('PASS: the page lives only at the route the nav tab points to')

// A whole-archive scan cannot answer inside performFetch's 10s default, and a
// retry would restart it from scratch (Silas, 2026-09-22: "Request timed out
// after 10000ms" on the first live Dry Run).
if (!/const ARCHIVE_SCAN_TIMEOUT_MS = 600_000/.test(store)) {
  console.error(
    "FAIL: the scan calls must pass an explicit long timeout, not performFetch's 10s default",
  )
  failed = true
} else console.log('PASS: the scan calls pass an explicit long timeout')

if (!/const ARCHIVE_SCAN_RETRIES = 0/.test(store)) {
  console.error(
    'FAIL: a scan must never be retried -- a retry restarts the whole walk',
  )
  failed = true
} else console.log('PASS: a timed-out scan is not retried')

const scanCallsUseTimeout = (
  store.match(/ARCHIVE_SCAN_RETRIES,\s*\n\s*ARCHIVE_SCAN_TIMEOUT_MS,/g) || []
).length
if (scanCallsUseTimeout !== 2) {
  console.error(
    `FAIL: both dry-run and import must use the long timeout (found ${scanCallsUseTimeout} of 2)`,
  )
  failed = true
} else console.log('PASS: both dry-run and import use the long timeout')

// THE HEADER RULE: workspace-header already renders room, title and subtitle
// from the channel front matter. The page's own copy was both a duplicate and,
// having no surface, unreadable over the backdrop art.
if (/kr-text-black-2xl/.test(page)) {
  console.error(
    'FAIL: the page renders its own title block again -- workspace-header already does that',
  )
  failed = true
} else console.log('PASS: the page renders no duplicate title block')

// Every block that can carry text sits on a surface, so none of it lands
// directly on the backdrop art.
if (/class="mb-2 flex/.test(page)) {
  console.error(
    'FAIL: a bare control row has no surface and will be unreadable over backdrop art',
  )
  failed = true
} else console.log('PASS: the control rows sit on a surface')

if (/class="kr-note kr-note-error">\{\{ archive\.error \}\}/.test(page)) {
  console.error(
    'FAIL: the error notice is back on a 10% tint that vanishes over backdrop art',
  )
  failed = true
} else console.log('PASS: the error notice sits on a real surface')

const runner = 'scripts/art-archive-ingest.sh'
if (!fs.existsSync(runner)) {
  console.error(
    `FAIL: ${runner} is missing -- the bulk pass has no host-side route`,
  )
  failed = true
} else {
  const shell = fs.readFileSync(runner, 'utf8')
  const runnerChecks = [
    // Silas, 2026-09-22, running it for real on Alexandria: "curl: (7) Failed
    // to connect to 127.0.0.1 port 3000". deploy-unraid.sh puts the container
    // on the `cafepurr` docker network, so the app's port is not necessarily
    // published to the host at all. The request has to happen INSIDE the
    // container, where 127.0.0.1:3000 is what the image's own HEALTHCHECK
    // already uses.
    ['runner reaches the app through docker exec', /docker exec -i/],
    // Silas, second live run: "no admin token in this environment". The app
    // container's docker-level env does NOT hold the token -- the Dockerfile
    // CMD loads /config/kind-robots.env with node's own --env-file-if-exists,
    // and deploy-unraid.sh passes --env-file only to the one-shot migration
    // container. A `docker exec node` is a fresh process that inherits neither.
    // The exec has to repeat the CMD's flag.
    [
      'exec loads the same config file the app CMD does',
      /"--env-file-if-exists=\$CONTAINER_ENV_FILE"/,
    ],
    [
      'container config path matches the Dockerfile CMD',
      /KIND_ROBOTS_CONTAINER_ENV_FILE:-\/config\/kind-robots\.env/,
    ],
    [
      'a missing container config names its own remedy',
      /pass --container-env-file/,
    ],
    [
      'runner defaults to the deployed container name',
      /KIND_ROBOTS_CONTAINER:-KindRobots/,
    ],
    ['runner does not default to the host loopback', /KIND_ROBOTS_URL:-\}/],
    ['runner drives the chosen endpoint', /art-archive\/\$\{endpoint\}/],
    ['runner defaults to the read-only dry run', /ENDPOINT='dry-run'/],
    [
      'runner requires an explicit --import to write',
      /--import\) ENDPOINT='import'/,
    ],
    // undici caps headersTimeout at 5 minutes and a whole-archive scan can
    // exceed that before the server sends a single header, so the request uses
    // node:http with no timeout rather than fetch.
    [
      'runner requests over node:http, not fetch',
      /import http from 'node:http'/,
    ],
    [
      'runner sets no timeout on the request',
      /No timeout is set anywhere on purpose/,
    ],
    [
      'runner names both docker failure modes',
      /docker is not available here[\s\S]*not found\. Pass --container/,
    ],
    // In the docker path the credential never moves: it is read from the
    // container's own env, which docker loaded from the deploy env file.
    [
      'request reads its credential from its own environment',
      /process\.env\.BETA_ADMIN_TOKEN \|\|\n\s*process\.env\.ADMIN_TOKEN/,
    ],
    [
      'runner still supports a remote --url with a host token',
      /ERROR: --url needs an admin token/,
    ],
    ['runner reads the env file without sourcing it', /it is read, never run/],
    [
      'runner honours an already-exported token',
      /KR_API_TOKEN:-\$\{BETA_ADMIN_TOKEN:-\$\{ADMIN_TOKEN:-\}\}\}/,
    ],
    [
      'runner reads the tokens authGuard accepts',
      /for key in BETA_ADMIN_TOKEN ADMIN_TOKEN KR_API_TOKEN/,
    ],
    [
      'runner defaults to the deploy env file',
      /KIND_ROBOTS_ENV_FILE:-\$APP_DIR\/\.env/,
    ],
  ]
  for (const [name, pattern] of runnerChecks) {
    if (!pattern.test(shell)) {
      console.error(`FAIL: ${name}`)
      failed = true
    } else console.log(`PASS: ${name}`)
  }
}

if (failed) process.exit(1)
console.log('Art Archive ingestion controls contract verified.')
