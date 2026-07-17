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
//   reusing unhealthy ProxySQL sockets during sustained API tests
// - the adapter's binary execute() path can retain a closed command channel
// - a fallback pool with minimumIdle=0 never established a connection and timed out
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
assert.match(prismaSource, /initializationTimeout:\s*acquireTimeout/)
assert.match(prismaSource, /DEFAULT_IDLE_TIMEOUT_SECONDS/)
assert.match(prismaSource, /DEFAULT_MINIMUM_IDLE/)
assert.doesNotMatch(prismaSource, /DATABASE_IDLE_TIMEOUT_SECONDS,\s*15/)
assert.doesNotMatch(prismaSource, /DATABASE_MINIMUM_IDLE,\s*0/)
assert.match(prismaSource, /process\.env\.DATABASE_USE_TEXT_PROTOCOL/)
assert.match(
  prismaSource,
  /new PrismaMariaDb\(\s*buildDatabaseConfig\(databaseUrl, poolOverrides\)/,
)
assert.match(
  prismaSource,
  /return raw !== 'false' && raw !== '0' && raw !== 'no'/,
)

// Once the shared adapter emits the stale-channel error, future non-transaction
// model operations bypass it through an initialized, single-connection client.
// Fallback operations are serialized so background heartbeat/queue traffic cannot
// create a connection storm on the same warm Vercel instance.
assert.match(prismaSource, /prismaAdapterPoisoned\?: boolean/)
assert.match(prismaSource, /prismaOneShotQueue\?: Promise<void>/)
assert.match(prismaSource, /globalForPrisma\.prismaAdapterPoisoned = true/)
assert.match(prismaSource, /\[prisma:adapter-poisoned\]/)
assert.match(prismaSource, /\[prisma:one-shot-fallback\]/)
assert.match(prismaSource, /\[prisma:one-shot-ready\]/)
assert.match(prismaSource, /const oneShotPoolOverrides/)
assert.match(prismaSource, /connectionLimit:\s*1/)
assert.match(prismaSource, /minimumIdle:\s*1/)
assert.match(prismaSource, /idleTimeout:\s*30/)
assert.match(prismaSource, /minDelayValidation:\s*500/)
assert.match(prismaSource, /serializeOneShotOperation/)
assert.match(prismaSource, /await oneShotPrisma\.\$connect\(\)/)
assert.match(
  prismaSource,
  /await oneShotPrisma\.\$queryRawUnsafe\('SELECT 1 AS prisma_one_shot_ready'\)/,
)
assert.match(prismaSource, /await oneShotPrisma\.\$disconnect\(\)/)
assert.match(prismaSource, /replayPrismaOperation/)
assert.match(prismaSource, /new Proxy\(\{\} as RetryingPrismaClient/)
assert.doesNotMatch(prismaSource, /prismaRecovery/)
assert.doesNotMatch(prismaSource, /\[prisma:client-recycled\]/)
assert.doesNotMatch(prismaSource, /minimumIdle:\s*0/)

// A failed statement inside an explicit transaction must never be replayed on a
// one-shot client outside that transaction. Transaction callers are tracked
// through the stable proxy and receive the original error so Prisma rolls back.
assert.match(prismaSource, /new AsyncLocalStorage<boolean>\(\)/)
assert.match(prismaSource, /property === '\$transaction'/)
assert.match(prismaSource, /transactionContext\.run\(true/)
assert.match(prismaSource, /const transactionActive =/)
assert.match(prismaSource, /if \(!model \|\| transactionActive\) throw error/)

// The shared client itself must never be disconnected during request recovery;
// only the explicitly isolated one-shot client may be closed.
assert.doesNotMatch(prismaSource, /basePrisma\.\$disconnect\(\)/)
assert.doesNotMatch(prismaSource, /activePrisma\.\$disconnect\(\)/)

// Project Sync retains its direct MariaDB fallback as an independent control and
// final route-specific safety net.
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
    'contains poisoned warm instances with initialized serialized one-shot clients.',
)
