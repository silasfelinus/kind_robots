import fs from 'node:fs'
import path from 'node:path'

const cleanupFile = path.resolve('.cypress-cache/seed-cleanup-latest.json')
const orphanFile = path.resolve('.cypress-cache/orphan-user-sweep-latest.json')

const readJson = (file) => {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing Cypress cleanup report: ${file}`)
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

const cleanup = readJson(cleanupFile)
const orphan = readJson(orphanFile)
const failures = []

for (const entry of Array.isArray(cleanup) ? cleanup : []) {
  if (entry?.ok === false) failures.push({ source: path.basename(cleanupFile), entry })
}
for (const entry of Array.isArray(orphan?.results) ? orphan.results : []) {
  if (entry?.ok === false) failures.push({ source: path.basename(orphanFile), entry })
}

if (failures.length > 0) {
  console.error(`Cypress cleanup leaked ${failures.length} item(s).`)
  console.error(JSON.stringify(failures, null, 2))
  process.exit(1)
}

console.log(
  `Cypress cleanup verified: ${Array.isArray(cleanup) ? cleanup.length : 0} cleanup result(s), ` +
    `${Number(orphan?.candidates || 0)} stale user candidate(s).`,
)
