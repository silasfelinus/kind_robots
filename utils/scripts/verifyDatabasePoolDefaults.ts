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
  VERCEL_ACQUIRE_TIMEOUT_MS,
  VERCEL_CONNECTION_LIMIT,
  VERCEL_CONNECT_TIMEOUT_MS,
  VERCEL_IDLE_TIMEOUT_SECONDS,
  VERCEL_MINIMUM_IDLE,
  VERCEL_PING_TIMEOUT_MS,
  VERCEL_PREVIEW_CONNECTION_LIMIT,
  VERCEL_PREVIEW_IDLE_TIMEOUT_SECONDS,
  VERCEL_PREVIEW_MINIMUM_IDLE,
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

const longLivedDefaults = resolveDatabasePoolDefaults({})
const vercelDefaults = resolveDatabasePoolDefaults({
  VERCEL: '1',
  VERCEL_ENV: 'production',
})
const previewDefaults = resolveDatabasePoolDefaults({
  VERCEL: '1',
  VERCEL_ENV: 'preview',
})

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

// Production Vercel scales by function-process count. A warm connection per
// lambda caused 200 ProxySQL frontend sessions while MariaDB remained bounded.
assert.equal(vercelDefaults.profile, 'vercel-function')
assert.equal(vercelDefaults.connectionLimit, VERCEL_CONNECTION_LIMIT)
assert.equal(vercelDefaults.connectTimeoutMs, VERCEL_CONNECT_TIMEOUT_MS)
assert.equal(vercelDefaults.acquireTimeoutMs, VERCEL_ACQUIRE_TIMEOUT_MS)
assert.equal(vercelDefaults.idleTimeoutSeconds, VERCEL_IDLE_TIMEOUT_SECONDS)
assert.equal(vercelDefaults.minimumIdle, VERCEL_MINIMUM_IDLE)
assert.equal(vercelDefaults.pingTimeoutMs, VERCEL_PING_TIMEOUT_MS)
assert.ok(
  vercelDefaults.connectionLimit <= 2,
  'A production Vercel function must not carry a server-sized connector pool.',
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

// Preview deployments multiply across PR commits and browser audits. While they
// still share the production ProxySQL user, each preview process gets one
// connection maximum and retires it faster than production.
assert.equal(previewDefaults.profile, 'vercel-preview')
assert.equal(
  previewDefaults.connectionLimit,
  VERCEL_PREVIEW_CONNECTION_LIMIT,
)
assert.equal(
  previewDefaults.idleTimeoutSeconds,
  VERCEL_PREVIEW_IDLE_TIMEOUT_SECONDS,
)
assert.equal(previewDefaults.minimumIdle, VERCEL_PREVIEW_MINIMUM_IDLE)
assert.equal(previewDefaults.connectionLimit, 1)
assert.ok(
  previewDefaults.connectionLimit < vercelDefaults.connectionLimit,
  'Preview pool capacity must stay below production while previews share its DB user.',
)
assert.ok(
  previewDefaults.idleTimeoutSeconds < vercelDefaults.idleTimeoutSeconds,
  'Preview idle sessions must retire faster than production sessions.',
)

withEnvironment(
  {
    VERCEL: '1',
    VERCEL_ENV: 'production',
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

    assert.equal(
      resolved.searchParams.get('connectionLimit'),
      String(VERCEL_CONNECTION_LIMIT),
      'Production Vercel must clamp stale URL and environment pool-size overrides.',
    )
    assert.equal(
      resolved.searchParams.get('idleTimeout'),
      String(VERCEL_IDLE_TIMEOUT_SECONDS),
      'Production Vercel must retire idle ProxySQL frontends promptly despite stale overrides.',
    )
    assert.equal(
      resolved.searchParams.get('minimumIdle'),
      String(VERCEL_MINIMUM_IDLE),
      'Vercel must never retain one frontend connection per warm function.',
    )
  },
)

withEnvironment(
  {
    VERCEL: '1',
    VERCEL_ENV: 'preview',
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

    assert.equal(
      resolved.searchParams.get('connectionLimit'),
      String(VERCEL_PREVIEW_CONNECTION_LIMIT),
      'Preview Vercel must clamp even production-safe overrides to its stricter pool.',
    )
    assert.equal(
      resolved.searchParams.get('idleTimeout'),
      String(VERCEL_PREVIEW_IDLE_TIMEOUT_SECONDS),
      'Preview Vercel must retire frontend sessions aggressively.',
    )
    assert.equal(
      resolved.searchParams.get('minimumIdle'),
      String(VERCEL_PREVIEW_MINIMUM_IDLE),
    )
  },
)

withEnvironment(
  {
    VERCEL: undefined,
    VERCEL_ENV: undefined,
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

for (const defaults of [longLivedDefaults, vercelDefaults, previewDefaults]) {
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

assert.match(poolDefaultsSource, /env\.VERCEL === '1'/)
assert.match(poolDefaultsSource, /env\.VERCEL_ENV === 'preview'/)
assert.match(poolDefaultsSource, /profile:\s*'vercel-function'/)
assert.match(poolDefaultsSource, /profile:\s*'vercel-preview'/)
assert.match(poolDefaultsSource, /VERCEL_CONNECTION_LIMIT = 2/)
assert.match(poolDefaultsSource, /VERCEL_IDLE_TIMEOUT_SECONDS = 15/)
assert.match(poolDefaultsSource, /VERCEL_MINIMUM_IDLE = 0/)
assert.match(poolDefaultsSource, /VERCEL_PREVIEW_CONNECTION_LIMIT = 1/)
assert.match(poolDefaultsSource, /VERCEL_PREVIEW_IDLE_TIMEOUT_SECONDS = 5/)
assert.match(poolDefaultsSource, /LONG_LIVED_CONNECTION_LIMIT = 10/)
assert.match(poolDefaultsSource, /LONG_LIVED_MINIMUM_IDLE = 1/)

// Request-time Prisma and standalone scripts consume the active runtime profile
// through the adapter. Long-lived overrides remain supported, while every
// Vercel environment is clamped to its own serverless safety envelope.
assert.match(adapterSource, /process\.env\.DATABASE_CONNECTION_LIMIT/)
assert.match(adapterSource, /process\.env\.DATABASE_IDLE_TIMEOUT_SECONDS/)
assert.match(adapterSource, /process\.env\.DATABASE_MINIMUM_IDLE/)
assert.match(adapterSource, /process\.env\.DATABASE_PING_TIMEOUT_MS/)
assert.match(adapterSource, /isVercelFunctionRuntime\(\)/)
assert.match(adapterSource, /resolveDatabasePoolDefaults\(\)/)
assert.match(
  adapterSource,
  /Math\.min\(requestedConnectionLimit, runtimePoolDefaults\.connectionLimit\)/,
)
assert.match(
  adapterSource,
  /Math\.min\(requestedIdleTimeout, runtimePoolDefaults\.idleTimeoutSeconds\)/,
)
assert.match(
  adapterSource,
  /isVercelRuntime\s*\?\s*runtimePoolDefaults\.minimumIdle\s*:\s*requestedMinimumIdle/,
)
assert.match(adapterSource, /Clamped unsafe Vercel database pool override/)
assert.match(adapterSource, /profile:\s*runtimePoolDefaults\.profile/)
assert.match(adapterSource, /pipelining:\s*readDatabasePipelining\(\)/)
assert.match(adapterSource, /process\.env\.DATABASE_USE_TEXT_PROTOCOL/)
assert.match(
  adapterSource,
  /return raw !== 'false' && raw !== '0' && raw !== 'no'/,
)

// Preview builds must not mutate the production database. Production migrations
// remain mandatory, but idempotent maintenance may yield only after bounded
// retries end in a recognized transient connection-capacity failure.
assert.match(vercelBuildSource, /process\.env\.VERCEL_ENV === 'production'/)
assert.match(vercelBuildSource, /Skipping migrations and database seeds/)
assert.match(vercelBuildSource, /if \(!isVercelBuild \|\| isProductionDeployment\)/)
assert.match(vercelBuildSource, /const TRANSIENT_DATABASE_OUTPUT/)
assert.match(vercelBuildSource, /ER_USER_LIMIT_REACHED/)
assert.match(vercelBuildSource, /pool timeout/)
assert.match(vercelBuildSource, /runOptionalDatabaseMaintenance/)
assert.match(
  vercelBuildSource,
  /run\(\s*process\.execPath,\s*\['scripts\/prisma-migrate-deploy\.mjs'\]/s,
)
assert.doesNotMatch(
  vercelBuildSource,
  /runOptionalDatabaseMaintenance\(\s*process\.execPath,\s*\['scripts\/prisma-migrate-deploy\.mjs'\]/s,
)
for (const maintenanceScript of [
  'scripts/seed_achievements.ts',
  'scripts/generate_achievement_art.ts',
  'scripts/seed_contenders.ts',
]) {
  assert.match(
    vercelBuildSource,
    new RegExp(
      `runOptionalDatabaseMaintenance\\([\\s\\S]*?${maintenanceScript.replaceAll('/', '\\/')}`,
    ),
  )
}

// Browser audits still share one database identity, so only one heavy crawler
// may run at a time across every PR and the hourly production sweep. GitHub may
// retain one pending replacement, but it must not cancel a healthy running
// audit just because another deployment arrived. A deployment whose branch head
// moved while queued exits before touching the database.
assert.match(
  responsiveAuditSource,
  /group: responsive-layout-audit-database/,
)
assert.match(responsiveAuditSource, /cancel-in-progress:\s*false/)
assert.doesNotMatch(
  responsiveAuditSource,
  /group: responsive-layout-audit-\$\{\{ github\.event\.deployment_status\.target_url/,
)
assert.doesNotMatch(
  responsiveAuditSource,
  /group: responsive-layout-audit-\$\{\{ github\.event\.deployment\.ref/,
)
assert.match(responsiveAuditSource, /name: Check deployment freshness/)
assert.match(responsiveAuditSource, /git ls-remote --heads origin/)
assert.match(responsiveAuditSource, /Skipping superseded deployment/)
assert.match(
  responsiveAuditSource,
  /steps\.freshness\.outputs\.run_audit == 'true'/,
)

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
assert.match(capacityDiagnosticSource, /PRAGMA table_info\(stats_mysql_processlist\)/)
assert.doesNotMatch(capacityDiagnosticSource, /SHOW COLUMNS FROM stats_mysql_processlist/)
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
    `production=${vercelDefaults.connectionLimit}/${vercelDefaults.minimumIdle}/` +
    `${vercelDefaults.idleTimeoutSeconds}s, preview=${previewDefaults.connectionLimit}/` +
    `${previewDefaults.minimumIdle}/${previewDefaults.idleTimeoutSeconds}s; ` +
    'one Prisma client per process and database-backed audits globally serialized.',
)
