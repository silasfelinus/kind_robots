// /utils/scripts/verifyWonderLabReconcileTransaction.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const endpointPath = resolve(
  scriptDirectory,
  '../../server/api/components/reconcile.post.ts',
)
const source = readFileSync(endpointPath, 'utf8')

assert.doesNotMatch(
  source,
  /prisma\.\$transaction\(async\s*\(/,
  'Production reconciliation must not use an interactive callback transaction with an expiry deadline.',
)
assert.doesNotMatch(
  source,
  /prisma\.component\.update\(/,
  'Canonical updates must not issue one Prisma operation per Component.',
)
assert.match(
  source,
  /function buildBulkUpdateQuery/,
  'Canonical updates must be assembled into one bounded bulk statement.',
)
assert.ok(
  source.includes('UPDATE \\`Component\\`') &&
    source.includes('CASE \\`id\\`'),
  'The bulk update must target Component rows by their existing IDs.',
)
assert.match(
  source,
  /prisma\.\$executeRaw\(updateQuery\)/,
  'The canonical update plan must execute as one parameterized raw statement.',
)
assert.match(
  source,
  /prisma\.component\.createMany\(/,
  'New manifest Components must be collapsed into one createMany statement.',
)
assert.match(
  source,
  /await prisma\.\$transaction\(operations\)/,
  'The bulk update and bulk create must commit together atomically.',
)
assert.match(
  source,
  /Prisma\.join\(assignments, ', '\)/,
  'Bulk assignments must be composed through Prisma SQL helpers.',
)
assert.doesNotMatch(
  source,
  /\$executeRawUnsafe|Prisma\.raw\(/,
  'The reconciliation must not interpolate manifest data through unsafe raw SQL.',
)

console.log('WonderLab reconciliation bulk statement contract passed.')
