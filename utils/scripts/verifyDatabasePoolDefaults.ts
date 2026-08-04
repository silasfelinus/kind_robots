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
//   recreating unhealthy ProxySQL sockets during sustained API tests
// - ProxySQL rejects MariaDB command pipelining
// - replacing a shared Prisma client without closing its predecessor strands an
//   additional connector pool inside the same warm serverless runtime
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
const adapterSource = readFileSync(
  new URL('../../server/utils/databaseAdapterConfig.ts', import.meta.url),
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
const capacityDiagnosticSource = readFileSync(
  new URL('../../scripts/proxysql-capacity-diagnostics.sh', import.meta.url),
  'utf8',
)

// Pool configuration lives in the shared, side-effect-free adapter module so
// request-time Prisma and standalone maintenance scripts use identical defaults.
assert.match(adapterSource, /process\.env\.DATABASE_PING_TIMEOUT_MS/)
assert.match(adapterSource, /pingTimeout:\s*readPositiveInteger/)
assert.match(adapterSource, /DEFAULT_IDLE_TIMEOUT_SECONDS/)
assert.match(adapterSource, /DEFAULT_MINIMUM_IDLE/)
assert.doesNotMatch(adapterSource, /DATABASE_IDLE_TIMEOUT_SECONDS,\s*15/)
assert.doesNotMatch(adapterSource, /DATABASE_MINIMUM_IDLE,\s*0/)
assert.match(adapterSource, /process\.env\.DATABASE_USE_TEXT_PROTOCOL/)
assert.match(
  adapterSource,
  /return raw !== 'false' && raw !== '0' && raw !== 'no'/,
)
assert.match(adapterSource, /pipelining:\s*readDatabasePipelining\(\)/)

// The request-time singleton must consume the shared pool builder and create
// exactly one base Prisma client per warm runtime. Never resurrect the client
// replacement/replay mechanism: retired clients retain their connector pools,
// so each recovery generation can add connectionLimit more frontend sockets.
assert.match(
  prismaSource,
  /new PrismaMariaDb\(buildDatabaseConfig\(databaseUrl\),\s*\{\s*useTextProtocol/,
)
assert.equal(
  prismaSource.match(/new PrismaClient\(/g)?.length ?? 0,
  1,
  'server/utils/prisma.ts must create one Prisma client, not replacement pools',
)
assert.match(prismaSource, /poolLifecycle:\s*'singleton-per-runtime'/)
assert.match(prismaSource, /const basePrisma = globalForPrisma\.prisma/)
assert.match(prismaSource, /const retryingPrisma = extendPrismaClient\(basePrisma\)/)
assert.doesNotMatch(prismaSource, /prismaRecovery/)
assert.doesNotMatch(prismaSource, /prismaGeneration/)
assert.doesNotMatch(prismaSource, /recyclePrismaClient/)
assert.doesNotMatch(prismaSource, /replayPrismaOperation/)
assert.doesNotMatch(prismaSource, /replacement\.\$connect/)
assert.doesNotMatch(prismaSource, /\.\$disconnect\(\)/)
assert.doesNotMatch(prismaSource, /createIsolatedPrismaClient/)

// A failed statement inside a transaction must not be replayed. The stable
// proxy tracks transaction scope while all requests continue sharing one pool.
assert.match(prismaSource, /new AsyncLocalStorage<boolean>\(\)/)
assert.match(prismaSource, /property === '\$transaction'/)
assert.match(prismaSource, /transactionContext\.run\(true/)
assert.match(prismaSource, /transactionContext\.getStore\(\) \? 0/)

// The Alexandria diagnostic must inspect both sides of the proxy boundary so a
// future incident can distinguish direct bypass clients, backend retention, and
// sessions pinned out of multiplexing. It remains an explicitly manual,
// read-only host tool.
assert.match(capacityDiagnosticSource, /stats_mysql_connection_pool/)
assert.match(capacityDiagnosticSource, /stats_mysql_users/)
assert.match(capacityDiagnosticSource, /stats_mysql_processlist/)
assert.match(capacityDiagnosticSource, /multiplex_disabled/)
assert.match(capacityDiagnosticSource, /information_schema\.PROCESSLIST/)
assert.match(capacityDiagnosticSource, /information_schema\.INNODB_TRX/)
assert.match(capacityDiagnosticSource, /max_user_connections/)
assert.match(capacityDiagnosticSource, /PROXYSQL_CONTAINER/)
assert.match(capacityDiagnosticSource, /MARIADB_CONTAINER/)
assert.doesNotMatch(capacityDiagnosticSource, /docker\s+(restart|stop|kill)/)

// Project Sync keeps its direct MariaDB fallback as a route-specific final
// safety net when a stale adapter connection cannot recover.
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
    `ping=${DEFAULT_PING_TIMEOUT_MS}ms; Prisma keeps one pool per runtime, ` +
    'ProxySQL pipelining stays disabled, and the host census covers both sides.',
)
