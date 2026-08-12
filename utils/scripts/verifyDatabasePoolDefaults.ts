// /utils/scripts/verifyDatabasePoolDefaults.ts
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildDatabaseUrl } from './../../server/utils/databaseAdapterConfig'
import {
  LONG_LIVED_ACQUIRE_TIMEOUT_MS,
  LONG_LIVED_CONNECTION_LIMIT,
  LONG_LIVED_CONNECT_TIMEOUT_MS,
  LONG_LIVED_IDLE_TIMEOUT_SECONDS,
  LONG_LIVED_MINIMUM_IDLE,
  LONG_LIVED_PING_TIMEOUT_MS,
  SAFE_MINIMUM_LONG_LIVED_CONNECTION_LIMIT,
  resolveDatabasePoolDefaults,
} from './../../server/utils/databasePoolDefaults'

function withEnvironment(
  overrides: Record<string, string | undefined>,
  run: () => void,
): void {
  const previous = Object.fromEntries(
    Object.keys(overrides).map((key) => [key, process.env[key]]),
  )

  try {
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) Reflect.deleteProperty(process.env, key)
      else process.env[key] = value
    }
    run()
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) Reflect.deleteProperty(process.env, key)
      else process.env[key] = value
    }
  }
}

const longLivedDefaults = resolveDatabasePoolDefaults()

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
  longLivedDefaults.connectionLimit >= SAFE_MINIMUM_LONG_LIVED_CONNECTION_LIMIT,
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
assert.ok(
  longLivedDefaults.acquireTimeoutMs > longLivedDefaults.connectTimeoutMs,
  'The acquire timeout must exceed the connect timeout.',
)
assert.ok(
  longLivedDefaults.pingTimeoutMs >= 500 && longLivedDefaults.pingTimeoutMs <= 5_000,
  'The ping timeout must stay bounded.',
)

withEnvironment(
  {
    DATABASE_CONNECTION_LIMIT: '10',
    DATABASE_IDLE_TIMEOUT_SECONDS: '300',
    DATABASE_MINIMUM_IDLE: '1',
  },
  () => {
    const resolved = new URL(
      buildDatabaseUrl(
        'mysql://kindrobot:secret@database.example:5544/kindblank' +
          '?connectionLimit=12&idleTimeout=600&minimumIdle=4',
      ),
    )

    assert.equal(resolved.searchParams.get('connectionLimit'), '12')
    assert.equal(resolved.searchParams.get('idleTimeout'), '600')
    assert.equal(resolved.searchParams.get('minimumIdle'), '4')
  },
)

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
const responsiveAuditSource = readFileSync(
  new URL('../../.github/workflows/responsive-layout-audit.yml', import.meta.url),
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

assert.match(poolDefaultsSource, /profile:\s*'long-lived'/)
assert.match(poolDefaultsSource, /LONG_LIVED_CONNECTION_LIMIT = 10/)
assert.match(poolDefaultsSource, /LONG_LIVED_MINIMUM_IDLE = 1/)
assert.doesNotMatch(poolDefaultsSource, /VERCEL/)

assert.match(adapterSource, /process\.env\.DATABASE_CONNECTION_LIMIT/)
assert.match(adapterSource, /process\.env\.DATABASE_IDLE_TIMEOUT_SECONDS/)
assert.match(adapterSource, /process\.env\.DATABASE_MINIMUM_IDLE/)
assert.match(adapterSource, /process\.env\.DATABASE_PING_TIMEOUT_MS/)
assert.doesNotMatch(adapterSource, /VERCEL/)
assert.match(adapterSource, /pipelining:\s*readDatabasePipelining\(\)/)
assert.match(adapterSource, /process\.env\.DATABASE_USE_TEXT_PROTOCOL/)
assert.match(
  adapterSource,
  /return raw !== 'false' && raw !== '0' && raw !== 'no'/,
)

assert.match(responsiveAuditSource, /group: responsive-layout-audit-database/)
assert.match(responsiveAuditSource, /cancel-in-progress:\s*false/)
assert.match(responsiveAuditSource, /https:\/\/kindrobots\.org/)

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

assert.match(prismaSource, /new AsyncLocalStorage<boolean>\(\)/)
assert.match(prismaSource, /property === '\$transaction'/)
assert.match(prismaSource, /transactionContext\.run\(true/)
assert.match(prismaSource, /transactionContext\.getStore\(\) \? 0/)

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
assert.match(capacityDiagnosticSource, /PRAGMA table_info\(stats_mysql_processlist\)/)
assert.doesNotMatch(capacityDiagnosticSource, /SHOW COLUMNS FROM stats_mysql_processlist/)
assert.doesNotMatch(
  capacityDiagnosticSource,
  /SELECT[^;]*(transaction_found|multiplex_disabled)/s,
)
assert.match(capacityDiagnosticSource, /information_schema\.PROCESSLIST/)
assert.match(capacityDiagnosticSource, /information_schema\.INNODB_TRX/)
assert.doesNotMatch(capacityDiagnosticSource, /docker\s+(restart|stop|kill)/)

assert.match(clientDiagnosticSource, /Get-NetTCPConnection/)
assert.match(clientDiagnosticSource, /OwningProcess/)
assert.match(clientDiagnosticSource, /Get-CimInstance Win32_Process/)
assert.match(clientDiagnosticSource, /Node-family processes/)
assert.match(clientDiagnosticSource, /Hide-Secrets/)
assert.doesNotMatch(
  clientDiagnosticSource,
  /(Stop-Process|Remove-Item|Disable-NetAdapter|CloseMainWindow|taskkill)/,
)

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
  `Database pool verified for long-lived production: ${longLivedDefaults.connectionLimit}/` +
    `${longLivedDefaults.minimumIdle}/${longLivedDefaults.idleTimeoutSeconds}s; ` +
    'one Prisma client per process and database-backed audits globally serialized.',
)
