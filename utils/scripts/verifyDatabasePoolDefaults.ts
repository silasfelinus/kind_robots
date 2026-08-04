// /utils/scripts/verifyDatabasePoolDefaults.ts
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  LONG_LIVED_ACQUIRE_TIMEOUT_MS,
  LONG_LIVED_CONNECTION_LIMIT,
  LONG_LIVED_CONNECT_TIMEOUT_MS,
  LONG_LIVED_IDLE_TIMEOUT_SECONDS,
  LONG_LIVED_MINIMUM_IDLE,
  LONG_LIVED_PING_TIMEOUT_MS,
  SAFE_MINIMUM_LONG_LIVED_CONNECTION_LIMIT,
  VERCEL_ACQUIRE_TIMEOUT_MS,
  VERCEL_CONNECTION_LIMIT,
  VERCEL_CONNECT_TIMEOUT_MS,
  VERCEL_IDLE_TIMEOUT_SECONDS,
  VERCEL_MINIMUM_IDLE,
  VERCEL_PING_TIMEOUT_MS,
  resolveDatabasePoolDefaults,
} from './../../server/utils/databasePoolDefaults'

const longLivedDefaults = resolveDatabasePoolDefaults({})
const vercelDefaults = resolveDatabasePoolDefaults({ VERCEL: '1' })

// A controlled long-lived local process needs enough capacity for the app's
// parallel route work and may retain one validated socket.
assert.equal(longLivedDefaults.profile, 'long-lived')
assert.equal(longLivedDefaults.connectionLimit, LONG_LIVED_CONNECTION_LIMIT)
assert.equal(longLivedDefaults.connectTimeoutMs, LONG_LIVED_CONNECT_TIMEOUT_MS)
assert.equal(longLivedDefaults.acquireTimeoutMs, LONG_LIVED_ACQUIRE_TIMEOUT_MS)
assert.equal(
  longLivedDefaults.idleTimeoutSeconds,
  LONG_LIVED_IDLE_TIMEOUT_SECONDS,
)
assert.equal(longLivedDefaults.minimumIdle, LONG_LIVED_MINIMUM_IDLE)
assert.equal(longLivedDefaults.pingTimeoutMs, LONG_LIVED_PING_TIMEOUT_MS)
assert.ok(
  longLivedDefaults.connectionLimit >=
    SAFE_MINIMUM_LONG_LIVED_CONNECTION_LIMIT,
  'The controlled long-lived runtime must retain its established pool capacity.',
)
assert.ok(
  longLivedDefaults.idleTimeoutSeconds >= 300,
  'The long-lived runtime must retain validated sockets for at least 5 minutes.',
)
assert.ok(
  longLivedDefaults.minimumIdle >= 1 &&
    longLivedDefaults.minimumIdle <= longLivedDefaults.connectionLimit,
  'The long-lived runtime must keep at least one warm connection.',
)

// Vercel scales by function-process count. A warm connection per lambda caused
// 200 ProxySQL frontend sessions while MariaDB remained bounded near 40.
assert.equal(vercelDefaults.profile, 'vercel-function')
assert.equal(vercelDefaults.connectionLimit, VERCEL_CONNECTION_LIMIT)
assert.equal(vercelDefaults.connectTimeoutMs, VERCEL_CONNECT_TIMEOUT_MS)
assert.equal(vercelDefaults.acquireTimeoutMs, VERCEL_ACQUIRE_TIMEOUT_MS)
assert.equal(vercelDefaults.idleTimeoutSeconds, VERCEL_IDLE_TIMEOUT_SECONDS)
assert.equal(vercelDefaults.minimumIdle, VERCEL_MINIMUM_IDLE)
assert.equal(vercelDefaults.pingTimeoutMs, VERCEL_PING_TIMEOUT_MS)
assert.ok(
  vercelDefaults.connectionLimit <= 2,
  'A Vercel function must not carry a server-sized connector pool.',
)
assert.equal(
  vercelDefaults.minimumIdle,
  0,
  'A Vercel function must not retain a ProxySQL frontend merely to stay warm.',
)
assert.ok(
  vercelDefaults.idleTimeoutSeconds <= 30,
  'Idle Vercel frontend sessions must retire promptly.',
)

for (const defaults of [longLivedDefaults, vercelDefaults]) {
  assert.ok(
    defaults.acquireTimeoutMs > defaults.connectTimeoutMs,
    `${defaults.profile} acquire timeout must exceed its connect timeout.`,
  )
  assert.ok(
    defaults.pingTimeoutMs >= 500 && defaults.pingTimeoutMs <= 5_000,
    `${defaults.profile} ping timeout must stay bounded.`,
  )
}

const prismaSource = readFileSync(
  new URL('../../server/utils/prisma.ts', import.meta.url),
  'utf8',
)
const poolDefaultsSource = readFileSync(
  new URL('../../server/utils/databasePoolDefaults.ts', import.meta.url),
  'utf8',
)
const adapterSource = readFileSync(
  new URL('../../server/utils/databaseAdapterConfig.ts', import.meta.url),
  'utf8',
)
const vercelBuildSource = readFileSync(
  new URL('../../scripts/vercel-build.mjs', import.meta.url),
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
const capacityDiagnosticUrl = new URL(
  '../../scripts/proxysql-capacity-diagnostics.sh',
  import.meta.url,
)
const capacityDiagnosticSource = readFileSync(capacityDiagnosticUrl, 'utf8')
const clientDiagnosticSource = readFileSync(
  new URL('../../scripts/database-client-connections.ps1', import.meta.url),
  'utf8',
)

assert.match(poolDefaultsSource, /env\.VERCEL === '1'/)
assert.match(poolDefaultsSource, /profile:\s*'vercel-function'/)
assert.match(poolDefaultsSource, /VERCEL_CONNECTION_LIMIT = 2/)
assert.match(poolDefaultsSource, /VERCEL_IDLE_TIMEOUT_SECONDS = 15/)
assert.match(poolDefaultsSource, /VERCEL_MINIMUM_IDLE = 0/)
assert.match(poolDefaultsSource, /LONG_LIVED_CONNECTION_LIMIT = 10/)
assert.match(poolDefaultsSource, /LONG_LIVED_MINIMUM_IDLE = 1/)

// Request-time Prisma and standalone scripts consume the same active runtime
// defaults through the adapter. Explicit DATABASE_* overrides remain supported.
assert.match(adapterSource, /process\.env\.DATABASE_CONNECTION_LIMIT/)
assert.match(adapterSource, /process\.env\.DATABASE_IDLE_TIMEOUT_SECONDS/)
assert.match(adapterSource, /process\.env\.DATABASE_MINIMUM_IDLE/)
assert.match(adapterSource, /process\.env\.DATABASE_PING_TIMEOUT_MS/)
assert.match(adapterSource, /pipelining:\s*readDatabasePipelining\(\)/)
assert.match(adapterSource, /process\.env\.DATABASE_USE_TEXT_PROTOCOL/)
assert.match(
  adapterSource,
  /return raw !== 'false' && raw !== '0' && raw !== 'no'/,
)

// Preview builds must not mutate the production database. Their deployed API
// runtime may read it, but it receives the Vercel pool profile above.
assert.match(vercelBuildSource, /process\.env\.VERCEL_ENV === 'production'/)
assert.match(vercelBuildSource, /Skipping migrations and database seeds/)
assert.match(vercelBuildSource, /if \(!isVercelBuild \|\| isProductionDeployment\)/)

// The request-time singleton creates exactly one base Prisma client per process.
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
assert.doesNotMatch(prismaSource, /createIsolatedPrismaClient/)

// A failed statement inside a transaction must not be replayed.
assert.match(prismaSource, /new AsyncLocalStorage<boolean>\(\)/)
assert.match(prismaSource, /property === '\$transaction'/)
assert.match(prismaSource, /transactionContext\.run\(true/)
assert.match(prismaSource, /transactionContext\.getStore\(\) \? 0/)

// The Alexandria diagnostic remains read-only and source-compatible.
execFileSync('bash', ['-n', fileURLToPath(capacityDiagnosticUrl)], {
  stdio: 'pipe',
})
assert.match(capacityDiagnosticSource, /stats_mysql_connection_pool/)
assert.match(capacityDiagnosticSource, /stats_mysql_users/)
assert.match(capacityDiagnosticSource, /stats_mysql_processlist/)
assert.match(capacityDiagnosticSource, /cli_host/)
assert.match(capacityDiagnosticSource, /frontend source totals/)
assert.match(capacityDiagnosticSource, /proxysql_sql_optional/)
assert.match(capacityDiagnosticSource, /Access_Denied_Max_User_Connections/)
assert.doesNotMatch(
  capacityDiagnosticSource,
  /SELECT[^;]*(transaction_found|multiplex_disabled)/s,
)
assert.match(capacityDiagnosticSource, /information_schema\.PROCESSLIST/)
assert.match(capacityDiagnosticSource, /information_schema\.INNODB_TRX/)
assert.doesNotMatch(capacityDiagnosticSource, /docker\s+(restart|stop|kill)/)

// The local Windows diagnostic identifies owning PIDs without mutation.
assert.match(clientDiagnosticSource, /Get-NetTCPConnection/)
assert.match(clientDiagnosticSource, /OwningProcess/)
assert.match(clientDiagnosticSource, /Get-CimInstance Win32_Process/)
assert.match(clientDiagnosticSource, /Node-family processes/)
assert.match(clientDiagnosticSource, /Hide-Secrets/)
assert.doesNotMatch(
  clientDiagnosticSource,
  /(Stop-Process|Remove-Item|Disable-NetAdapter|CloseMainWindow|taskkill)/,
)

// Project Sync keeps its route-specific direct fallback.
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
  `Database pool profiles verified: local=${longLivedDefaults.connectionLimit}/` +
    `${longLivedDefaults.minimumIdle}/${longLivedDefaults.idleTimeoutSeconds}s, ` +
    `vercel=${vercelDefaults.connectionLimit}/${vercelDefaults.minimumIdle}/` +
    `${vercelDefaults.idleTimeoutSeconds}s; one Prisma client per process.`,
)
