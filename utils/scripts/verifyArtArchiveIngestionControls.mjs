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
const page = fs.readFileSync('pages/admin/art-archive.vue', 'utf8')

const checks = [
  [
    'store calls the dry-run endpoint',
    store,
    /performFetch<ArchiveDryRunReport>\('\/api\/admin\/art-archive\/dry-run', \{ method: 'POST' \}\)/,
  ],
  [
    'store calls the import endpoint',
    store,
    /performFetch<ArchiveImportReport>\('\/api\/admin\/art-archive\/import', \{ method: 'POST' \}\)/,
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

if (failed) process.exit(1)
console.log('Art Archive ingestion controls contract verified.')
