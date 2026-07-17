import fs from 'node:fs'
import path from 'node:path'

const cleanupFile = path.resolve('.cypress-cache/seed-cleanup-latest.json')
const orphanFile = path.resolve('.cypress-cache/orphan-user-sweep-latest.json')

// Missing reports mean Cypress never ran to completion (e.g. the deploy gate
// failed and the test step was skipped, or the run crashed before its
// after:run hook). Hard-throwing here used to mask the real failure with a
// confusing "Missing Cypress cleanup report" error. Return null instead so the
// caller can decide, and only fail on reports that are present and show leaks.
const readJson = (file) => {
  if (!fs.existsSync(file)) {
    console.warn(
      `Cleanup report not found: ${file} — Cypress likely did not run to ` +
        `completion; see the Cypress step for the real failure.`,
    )
    return null
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

const cleanup = readJson(cleanupFile)
const orphan = readJson(orphanFile)

if (cleanup === null && orphan === null) {
  console.log('Cypress cleanup verification skipped: no reports produced.')
  process.exit(0)
}

const failures = []

for (const entry of Array.isArray(cleanup) ? cleanup : []) {
  if (entry?.ok === false) failures.push({ source: path.basename(cleanupFile), entry })
}

if (orphan?.ok === false && orphan?.skipped !== true) {
  failures.push({ source: path.basename(orphanFile), entry: orphan })
}

const orphanFailed = Array.isArray(orphan?.data?.failed) ? orphan.data.failed : []
if (orphanFailed.length > 0) {
  failures.push({
    source: path.basename(orphanFile),
    entry: { failed: orphanFailed },
  })
}

const orphanRemaining = Number(orphan?.data?.remaining)
if (Number.isFinite(orphanRemaining) && orphanRemaining > 0) {
  failures.push({
    source: path.basename(orphanFile),
    entry: { remaining: orphanRemaining },
  })
}

if (failures.length > 0) {
  console.error(`Cypress cleanup leaked ${failures.length} item(s).`)
  console.error(JSON.stringify(failures, null, 2))
  process.exit(1)
}

console.log(
  `Cypress cleanup verified: ${Array.isArray(cleanup) ? cleanup.length : 0} cleanup result(s), ` +
    `${Number(orphan?.data?.deleted?.length || 0)} stale user(s) removed.`,
)
