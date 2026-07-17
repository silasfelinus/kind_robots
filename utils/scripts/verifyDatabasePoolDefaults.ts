// /utils/scripts/verifyDatabasePoolDefaults.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DEFAULT_ACQUIRE_TIMEOUT_MS,
  DEFAULT_CONNECTION_LIMIT,
  DEFAULT_CONNECT_TIMEOUT_MS,
  DEFAULT_IDLE_TIMEOUT_SECONDS,
  DEFAULT_MINIMUM_IDLE,
  DEFAULT_PING_TIMEOUT_MS,
  SAFE_MINIMUM_CONNECTION_LIMIT,
} from './../../server/utils/databasePoolDefaults'

// Regression guards for the production pool failure modes:
// - too few connections starve every DB-backed route
// - retiring every idle connection after 15 seconds leaves warm Vercel instances
//   reusing or recreating unhealthy ProxySQL sockets during sustained API tests
// - the adapter's binary execute() path can retain a closed command channel
// - retrying through the same poisoned client repeats the same stale-socket error
assert.ok(
  DEFAULT_CONNECTION_LIMIT >= SAFE_MINIMUM_CONNECTION_LIMIT,
  `DEFAULT_CONNECTION_LIMIT (${DEFAULT_CONNECTION_LIMIT}) must be >= ` +
    `SAFE_MINIMUM_CONNECTION_LIMIT (${SAFE_MINIMUM_CONNECTION_LIMIT}) — ` +
    'see server/utils/databasePoolDefaults.ts',
)
assert.ok(
  DEFAULT_ACQUIRE_TIMEOUT_MS > DEFAULT_CONNECT_TIMEOUT_MS,
  'DEFAULT_ACQUIRE_TIMEOUT_MS must exceed DEFAULT_CONNECT_TIMEOUT_MS',
)
assert.ok(
  DEFAULT_IDLE_TIMEOUT_SECONDS >= 300,
  'DEFAULT_IDLE_TIMEOUT_SECONDS must retain pooled sockets for at least 5 minutes',
)
assert.ok(
  DEFAULT_MINIMUM_IDLE >= 1 &&
    DEFAULT_MINIMUM_IDLE <= DEFAULT_CONNECTION_LIMIT,
  'DEFAULT_MINIMUM_IDLE must keep at least one connection warm without exceeding the pool limit',
)
assert.ok(
  DEFAULT_PING_TIMEOUT_MS >= 500 && DEFAULT_PING_TIMEOUT_MS <= 5_000,
  'DEFAULT_PING_TIMEOUT_MS must bound validation without making every borrow slow',
)

const prismaSource = readFileSync(
  new URL('../../server/utils/prisma.ts', import.meta.url),
  'utf8',
)
const directProbeSource = readFileSync(
  new URL('../../server/utils/databaseDirectProbe.ts', import.meta.url),
  'utf8',
)
const directProjectSource = readFileSync(
  new URL('../../server/utils/projectDirectWrite.ts', import.meta.url),
  'utf8',
)
const projectCreateSource = readFileSync(
  new URL('../../server/api/projects/index.post.ts', import.meta.url),
  'utf8',
)

assert.match(prismaSource, /process\.env\.DATABASE_PING_TIMEOUT_MS/)
assert.match(prismaSource, /pingTimeout:\s*readPositiveInteger/)
assert.match(prismaSource, /DEFAULT_IDLE_TIMEOUT_SECONDS/)
assert.match(prismaSource, /DEFAULT_MINIMUM_IDLE/)
assert.doesNotMatch(prismaSource, /DATABASE_IDLE_TIMEOUT_SECONDS,\s*15/)
assert.doesNotMatch(prismaSource, /DATABASE_MINIMUM_IDLE,\s*0/)
assert.match(prismaSource, /process\.env\.DATABASE_USE_TEXT_PROTOCOL/)
assert.match(
  prismaSource,
  /new PrismaMariaDb\(buildDatabaseConfig\(databaseUrl\),\s*\{\s*useTextProtocol/,
)
assert.match(
  prismaSource,
  /return raw !== 'false' && raw !== '0' && raw !== 'no'/,
)

// A stale socket poisons the adapter client that owns its pool. Recovery must
// connect a replacement client, atomically redirect future calls, and replay the
// failed model operation through that replacement instead of calling the stale
// query closure again. Concurrent failures share one recovery promise.
assert.match(prismaSource, /globalForPrisma\.prismaRecovery/)
assert.match(prismaSource, /await replacement\.\$connect\(\)/)
assert.match(
  prismaSource,
  /activePrisma = extendPrismaClient\(replacement\)/,
)
assert.match(prismaSource, /replayPrismaOperation/)
assert.match(prismaSource, /new Proxy\(\{\} as RetryingPrismaClient/)

// Recovery may replace the client during an active transaction, but the failed
// statement must not be replayed outside that transaction. Transaction callers
// are tracked through the stable proxy and receive the original error so Prisma
// can roll back the transaction normally.
assert.match(prismaSource, /new AsyncLocalStorage<boolean>\(\)/)
assert.match(prismaSource, /property === '\$transaction'/)
assert.match(prismaSource, /transactionContext\.run\(true/)
assert.match(prismaSource, /transactionContext\.getStore\(\)/)

// Never disconnect the shared or retired client during request recovery. Other
// requests may still be completing transactions against it.
assert.doesNotMatch(prismaSource, /\.\$disconnect\(\)/)
assert.doesNotMatch(prismaSource, /createIsolatedPrismaClient/)

// Project Sync keeps its direct MariaDB fallback as a route-specific final
// safety net when adapter recovery cannot complete.
assert.match(
  directProbeSource,
  /export async function createDatabaseDirectConnection\(\)/,
)
assert.match(directProjectSource, /ON DUPLICATE KEY UPDATE/)
assert.match(directProjectSource, /await connection\.end\(\)/)
assert.match(
  projectCreateSource,
  /if \(!isStaleDatabaseConnectionError\(error\)\) throw error/,
)
assert.match(
  projectCreateSource,
  /return upsertProjectDirect\(data, conductorSlug\)/,
)

console.log(
  `Database pool safeguards verified: limit=${DEFAULT_CONNECTION_LIMIT}, ` +
    `connect=${DEFAULT_CONNECT_TIMEOUT_MS}ms, acquire=${DEFAULT_ACQUIRE_TIMEOUT_MS}ms, ` +
    `idle=${DEFAULT_IDLE_TIMEOUT_SECONDS}s, minimumIdle=${DEFAULT_MINIMUM_IDLE}, ` +
    `ping=${DEFAULT_PING_TIMEOUT_MS}ms; Prisma uses MariaDB text protocol and ` +
    'recycles poisoned clients without replaying outside active transactions.',
)
