// /utils/scripts/verifyDatabasePoolDefaults.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DEFAULT_CONNECTION_LIMIT,
  SAFE_MINIMUM_CONNECTION_LIMIT,
} from './../../server/utils/databasePoolDefaults'

// Regression guard: this fallback has silently dropped from 10 to 2 twice
// (e2caf03d, then kind_robots PR #296), each time causing a full production
// outage (every DB-backed route 503ing on pool exhaustion). Fail CI loudly
// instead of waiting for the next outage to notice.
assert.ok(
  DEFAULT_CONNECTION_LIMIT >= SAFE_MINIMUM_CONNECTION_LIMIT,
  `DEFAULT_CONNECTION_LIMIT (${DEFAULT_CONNECTION_LIMIT}) must be >= ` +
    `SAFE_MINIMUM_CONNECTION_LIMIT (${SAFE_MINIMUM_CONNECTION_LIMIT}) — ` +
    'see server/utils/databasePoolDefaults.ts',
)

const prismaSource = readFileSync(
  new URL('../../server/utils/prisma.ts', import.meta.url),
  'utf8',
)

// Project Sync exposed that retrying the same Prisma query after ProxySQL closes
// a warm socket can keep borrowing from the same poisoned pool. Guard the
// disconnect/connect reset and its stale-error-only call site.
assert.match(prismaSource, /prismaReconnect\?: Promise<void>/)
assert.match(prismaSource, /await basePrisma\.\$disconnect\(\)/)
assert.match(prismaSource, /await basePrisma\.\$connect\(\)/)
assert.match(
  prismaSource,
  /if \(staleConnectionError\) \{\s+await reconnectPrisma\(\)/,
)

console.log(
  `Database pool safeguards verified: connection limit ${DEFAULT_CONNECTION_LIMIT} >= ` +
    `${SAFE_MINIMUM_CONNECTION_LIMIT}, stale connections trigger a single-flight reconnect.`,
)
