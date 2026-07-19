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
assert.match(
  source,
  /const updateOperations = plan\.updates\.flatMap/,
  'Existing Component updates must be prepared as atomic batch transaction operations.',
)
assert.match(
  source,
  /prisma\.component\.createMany\(/,
  'New manifest Components must be collapsed into a single createMany statement.',
)
assert.match(
  source,
  /await prisma\.\$transaction\(\[\.\.\.updateOperations, \.\.\.createOperations\]\)/,
  'Updates and the bulk create must commit together in a non-interactive batch transaction.',
)
assert.doesNotMatch(
  source,
  /RECONCILE_TRANSACTION_OPTIONS|timeout:\s*\d/,
  'The reconciliation must not regress to an interactive transaction timeout workaround.',
)

console.log('WonderLab reconciliation batch transaction contract passed.')
