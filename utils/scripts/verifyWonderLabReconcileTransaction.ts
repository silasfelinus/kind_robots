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

assert.match(
  source,
  /const RECONCILE_TRANSACTION_OPTIONS = \{\s*maxWait: 10_000,\s*timeout: 30_000,\s*\} as const/s,
  'The production reconciliation must explicitly exceed Prisma interactive transactions\' 5-second default.',
)
assert.match(
  source,
  /prisma\.\$transaction\(async \(tx\) => \{[\s\S]*?\}, RECONCILE_TRANSACTION_OPTIONS\)/,
  'The bounded transaction options must be applied to the atomic reconciliation write transaction.',
)
assert.doesNotMatch(
  source,
  /timeout:\s*5_000/,
  'The reconciliation must not regress to the timeout that failed the 348-entry production manifest.',
)

console.log('WonderLab reconciliation transaction timeout contract passed.')
