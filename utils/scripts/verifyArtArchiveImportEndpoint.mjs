import fs from 'node:fs'

const source = fs.readFileSync('server/api/admin/art-archive/import.post.ts', 'utf8')
const checks = [
  ['requires admin authorization', /requireAdminApiUser\(event\)/],
  ['scans the archive root', /scanArchiveRoot\(getArtArchiveRoot\(\)\)/],
  ['imports the scan (performs the write)', /importArchiveScan\(scan, auth\.user\.id\)/],
  ['reports resource-match evidence for every scanned file', /matchArchiveResources\(/],
  ['aggregates resource-match evidence into the response', /aggregateResourceMatchSummaries\(/],
  [
    'returns filesWithMatchEvidence and unmatchedModels in the response data',
    /filesWithMatchEvidence,[\s\S]*?unmatchedModels,[\s\S]*?resourceMatches,/,
  ],
  ['states the imported-file count in its response message', /Imported \$\{summary\.filesScanned\} scanned file\(s\)/],
]

let failed = false
for (const [name, pattern] of checks) {
  if (!pattern.test(source)) {
    console.error(`FAIL: ${name}`)
    failed = true
  } else console.log(`PASS: ${name}`)
}

const handlerStart = source.indexOf('export default defineEventHandler')
const openBrace = source.indexOf('{', handlerStart)
let depth = 0
let end = -1
for (let i = openBrace; i < source.length; i += 1) {
  if (source[i] === '{') depth += 1
  else if (source[i] === '}') {
    depth -= 1
    if (depth === 0) {
      end = i
      break
    }
  }
}
const body = end === -1 ? source.slice(handlerStart) : source.slice(handlerStart, end + 1)

const requiredWritePath = ['importArchiveScan(']
const missing = requiredWritePath.filter((token) => !body.includes(token))
if (missing.length > 0) {
  console.error(`FAIL: import endpoint is missing its write path: ${missing.join(', ')}`)
  failed = true
} else console.log('PASS: import endpoint handler body contains the expected import write path')

if (body.includes('planArchiveReconciliation(')) {
  console.error('FAIL: import endpoint calls the dry-run-only reconciliation planner instead of importing')
  failed = true
} else console.log('PASS: import endpoint does not call the dry-run-only reconciliation planner')

if (failed) process.exit(1)
console.log('Art Archive import endpoint contract verified.')
