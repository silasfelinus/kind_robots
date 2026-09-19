import fs from 'node:fs'

const source = fs.readFileSync('server/api/admin/art-archive/dry-run.post.ts', 'utf8')
const checks = [
  ['requires admin authorization', /requireAdminApiUser\(event\)/],
  ['uses the known-file cache', /loadKnownArchiveFiles\(\)/],
  ['scans with the known-file cache', /scanArchiveRoot\(getArtArchiveRoot\(\), \{ knownFiles \}\)/],
  ['uses the pure reconciliation planner', /planArchiveReconciliation\(scan\.files, existingEntries\)/],
  ['reports resource-match evidence', /matchArchiveResources\(/],
  ['returns all reconciliation action counts', /new: countOf\('new'\)[\s\S]*unchanged:[\s\S]*changed:[\s\S]*moved:[\s\S]*copied:[\s\S]*missing:/],
  ['states that the preview performs no database writes', /with no database writes/],
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
const forbidden = [
  'reconcileArchiveScan(',
  'importArchiveFile(',
  'importArchiveScan(',
  '.create(',
  '.createMany(',
  '.update(',
  '.updateMany(',
  '.delete(',
  '.deleteMany(',
  '.upsert(',
]
const found = forbidden.filter((token) => body.includes(token))
if (found.length > 0) {
  console.error(`FAIL: dry-run endpoint calls a write path: ${found.join(', ')}`)
  failed = true
} else console.log('PASS: dry-run endpoint contains no known Prisma/import/reconciliation write path')

if (failed) process.exit(1)
console.log('Art Archive dry-run endpoint contract verified.')
