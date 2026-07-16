// /server/utils/prisma.ts
import { PrismaClient } from '~/prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { type ConnectionOptions as TlsConnectionOptions } from 'node:tls'
import {
  DEFAULT_ACQUIRE_TIMEOUT_MS,
  DEFAULT_CONNECTION_LIMIT,
  DEFAULT_CONNECT_TIMEOUT_MS,
  DEFAULT_IDLE_TIMEOUT_SECONDS,
  DEFAULT_MINIMUM_IDLE,
  DEFAULT_PING_TIMEOUT_MS,
} from './databasePoolDefaults'

type PrismaMariaDbConfig = ConstructorParameters<typeof PrismaMariaDb>[0]
type PrismaMariaDbPoolConfig = Exclude<PrismaMariaDbConfig, string>

type CircuitBreakerState = {
  failures: number
  openUntil: number
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaBreaker?: CircuitBreakerState
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing')
}

function readPositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function readNonNegativeInteger(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function buildDatabaseUrl(url: string): string {
  const parsed = new URL(url)
  const connectTimeout = readPositiveInteger(
    process.env.DATABASE_CONNECT_TIMEOUT_MS,
    DEFAULT_CONNECT_TIMEOUT_MS,
  )
  const acquireTimeout = readPositiveInteger(
    process.env.DATABASE_ACQUIRE_TIMEOUT_MS,
    DEFAULT_ACQUIRE_TIMEOUT_MS,
  )
  const connectionLimit = readPositiveInteger(
    process.env.DATABASE_CONNECTION_LIMIT,
    DEFAULT_CONNECTION_LIMIT,
  )
  const minDelayValidation = readNonNegativeInteger(
    process.env.DATABASE_MIN_DELAY_VALIDATION_MS,
    0,
  )
  const idleTimeout = readPositiveInteger(
    process.env.DATABASE_IDLE_TIMEOUT_SECONDS,
    DEFAULT_IDLE_TIMEOUT_SECONDS,
  )
  const minimumIdle = readNonNegativeInteger(
    process.env.DATABASE_MINIMUM_IDLE,
    DEFAULT_MINIMUM_IDLE,
  )
  const pingTimeout = readPositiveInteger(
    process.env.DATABASE_PING_TIMEOUT_MS,
    DEFAULT_PING_TIMEOUT_MS,
  )

  if (!parsed.searchParams.has('connectTimeout')) {
    parsed.searchParams.set('connectTimeout', String(connectTimeout))
  }

  if (!parsed.searchParams.has('acquireTimeout')) {
    parsed.searchParams.set('acquireTimeout', String(acquireTimeout))
  }

  if (!parsed.searchParams.has('connectionLimit')) {
    parsed.searchParams.set('connectionLimit', String(connectionLimit))
  }

  if (!parsed.searchParams.has('minDelayValidation')) {
    parsed.searchParams.set('minDelayValidation', String(minDelayValidation))
  }

  // Keep one connection warm and retain idle sockets long enough to avoid a
  // constant retire/recreate cycle across Vercel freeze/thaw. The connector
  // validates borrowed idle sockets, bounded by pingTimeout, before reuse.
  if (!parsed.searchParams.has('idleTimeout')) {
    parsed.searchParams.set('idleTimeout', String(idleTimeout))
  }

  if (!parsed.searchParams.has('minimumIdle')) {
    parsed.searchParams.set('minimumIdle', String(minimumIdle))
  }

  if (!parsed.searchParams.has('pingTimeout')) {
    parsed.searchParams.set('pingTimeout', String(pingTimeout))
  }

  return parsed.toString()
}

function readDatabaseSslCa(): string | undefined {
  const encoded = process.env.DATABASE_SSL_CA_BASE64?.trim()
  if (encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8').trim()
    if (!decoded.includes('BEGIN CERTIFICATE')) {
      throw new Error('DATABASE_SSL_CA_BASE64 is not a PEM certificate')
    }
    return decoded
  }

  const plain = process.env.DATABASE_SSL_CA?.replace(/\\n/g, '\n').trim()
  if (!plain) return undefined
  if (!plain.includes('BEGIN CERTIFICATE')) {
    throw new Error('DATABASE_SSL_CA is not a PEM certificate')
  }
  return plain
}

// Escape hatch. Default true (verify the server cert's CA + identity). Set
// DATABASE_SSL_REJECT_UNAUTHORIZED=false to keep the connection ENCRYPTED but
// stop verifying the certificate — the temporary unblock when ProxySQL presents
// a cert whose CA or SAN no longer matches (e.g. after a cert renewal, or when
// connecting by IP to a cert issued for a hostname). This trades away MITM
// protection on the DB link; treat it as a stopgap and re-enable verification
// once the cert/CA is fixed.
function readSslRejectUnauthorized(): boolean {
  const raw = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED?.trim().toLowerCase()
  return raw !== 'false' && raw !== '0' && raw !== 'no'
}

// Prisma's MariaDB adapter uses the binary execute() protocol by default. Under
// sustained Vercel traffic through ProxySQL, that path repeatedly retained a
// connection whose command channel was already closed, while the connector's
// query() path remained healthy for direct probes and fallback writes. Default
// to the adapter's supported text protocol for this topology. Set
// DATABASE_USE_TEXT_PROTOCOL=false to restore the binary protocol quickly.
function readDatabaseUseTextProtocol(): boolean {
  const raw = process.env.DATABASE_USE_TEXT_PROTOCOL?.trim().toLowerCase()
  return raw !== 'false' && raw !== '0' && raw !== 'no'
}

function buildDatabaseConfig(url: string): PrismaMariaDbConfig {
  const resolvedUrl = buildDatabaseUrl(url)
  const sslCa = readDatabaseSslCa()
  const rejectUnauthorized = readSslRejectUnauthorized()

  // No CA and full verification requested → nothing to customize; hand the
  // adapter the URL with its bounded pool options.
  if (!sslCa && rejectUnauthorized) return resolvedUrl

  const parsed = new URL(resolvedUrl)
  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''))
  // Verify the CA chain only — do NOT enforce a hostname/SAN match. This mirrors
  // the direct probe (server/utils/databaseDirectProbe.ts), which connects fine
  // with verification ON. A previous custom checkServerIdentity() pinned the cert
  // to the DATABASE_URL hostname; the ProxySQL frontend cert does not carry that
  // exact host in its SANs, so every *pooled* connection failed verification
  // while the (CA-only) direct probe succeeded — forcing the
  // DATABASE_SSL_REJECT_UNAUTHORIZED=false stopgap. CA-only keeps the link
  // encrypted and CA-trusted so verification can stay enabled. To restore
  // hostname pinning, reissue the ProxySQL cert with the DATABASE_URL host in its
  // SANs and add the check back.
  const tlsOptions: TlsConnectionOptions = rejectUnauthorized
    ? {
        ca: sslCa,
        rejectUnauthorized: true,
      }
    : {
        // Encrypted but unverified: no CA requirement, no identity check.
        ...(sslCa ? { ca: sslCa } : {}),
        rejectUnauthorized: false,
      }

  if (!rejectUnauthorized) {
    console.warn(
      '[prisma] DATABASE_SSL_REJECT_UNAUTHORIZED=false — TLS is on but the ' +
        'database certificate is NOT being verified. Stopgap only; restore ' +
        'verification once the ProxySQL cert/CA is fixed.',
    )
  }

  const poolConfig: PrismaMariaDbPoolConfig = {
    host: parsed.hostname,
    port: readPositiveInteger(parsed.port, 3_306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    connectTimeout: readPositiveInteger(
      parsed.searchParams.get('connectTimeout') ?? undefined,
      DEFAULT_CONNECT_TIMEOUT_MS,
    ),
    acquireTimeout: readPositiveInteger(
      parsed.searchParams.get('acquireTimeout') ?? undefined,
      DEFAULT_ACQUIRE_TIMEOUT_MS,
    ),
    connectionLimit: readPositiveInteger(
      parsed.searchParams.get('connectionLimit') ?? undefined,
      DEFAULT_CONNECTION_LIMIT,
    ),
    minDelayValidation: readNonNegativeInteger(
      parsed.searchParams.get('minDelayValidation') ?? undefined,
      0,
    ),
    idleTimeout: readPositiveInteger(
      parsed.searchParams.get('idleTimeout') ?? undefined,
      DEFAULT_IDLE_TIMEOUT_SECONDS,
    ),
    minimumIdle: readNonNegativeInteger(
      parsed.searchParams.get('minimumIdle') ?? undefined,
      DEFAULT_MINIMUM_IDLE,
    ),
    ssl: tlsOptions,
  }

  // MariaDB Connector/Node.js 3.5.2 supports pingTimeout at runtime, but its
  // published PoolConfig declaration does not expose the property. Assign it
  // after constructing the typed object so we retain full checking for every
  // declared pool option without casting the entire adapter config.
  Object.assign(poolConfig, {
    pingTimeout: readPositiveInteger(
      parsed.searchParams.get('pingTimeout') ?? undefined,
      DEFAULT_PING_TIMEOUT_MS,
    ),
  })

  return poolConfig
}

const staleConnectionMessages = [
  'Cannot execute new commands: connection closed',
]

const unavailableDatabaseMessages = [
  'pool timeout: failed to retrieve a connection from pool',
  'Max connect timeout reached',
]

// Acquisition failures consume the full timeout, so keep that retry budget at
// one. Closed pooled sockets fail immediately; two fast retries give the driver
// a chance to validate and discard an unhealthy socket without extending an
// outage by several seconds.
const unavailableRetryAttempts = readNonNegativeInteger(
  process.env.DATABASE_TRANSIENT_RETRY_ATTEMPTS,
  1,
)
const staleConnectionRetryAttempts = readNonNegativeInteger(
  process.env.DATABASE_STALE_CONNECTION_RETRY_ATTEMPTS,
  2,
)
const transientRetryDelayMs = readPositiveInteger(
  process.env.DATABASE_TRANSIENT_RETRY_DELAY_MS,
  100,
)

// Circuit breaker. Only true connection-acquisition outages count toward it.
// A stale pooled socket is local lifecycle noise and must not poison a warm
// instance that can recover by borrowing or creating another connection.
const breakerThreshold = readPositiveInteger(
  process.env.DATABASE_BREAKER_THRESHOLD,
  5,
)
const breakerCooldownMs = readPositiveInteger(
  process.env.DATABASE_BREAKER_COOLDOWN_MS,
  10_000,
)

const breaker: CircuitBreakerState = globalForPrisma.prismaBreaker ?? {
  failures: 0,
  openUntil: 0,
}
globalForPrisma.prismaBreaker = breaker

const CIRCUIT_OPEN_MESSAGE =
  'pool timeout: failed to retrieve a connection from pool (circuit open)'

function circuitIsOpen(): boolean {
  if (breaker.openUntil === 0) return false

  if (Date.now() >= breaker.openUntil) {
    // Cooldown elapsed: half-open. Allow one probe through.
    breaker.openUntil = 0
    breaker.failures = breakerThreshold - 1
    return false
  }

  return true
}

function recordConnectionSuccess(): void {
  breaker.failures = 0
  breaker.openUntil = 0
}

function recordAvailabilityFailure(): void {
  breaker.failures += 1
  if (breaker.failures >= breakerThreshold) {
    breaker.openUntil = Date.now() + breakerCooldownMs
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }

  return String(error)
}

function messageMatches(error: unknown, candidates: string[]): boolean {
  const message = errorMessage(error)
  return candidates.some((candidate) => message.includes(candidate))
}

export function isStaleDatabaseConnectionError(error: unknown): boolean {
  return messageMatches(error, staleConnectionMessages)
}

function isAvailabilityError(error: unknown): boolean {
  return messageMatches(error, unavailableDatabaseMessages)
}

function retryLimitFor(error: unknown): number {
  if (isStaleDatabaseConnectionError(error)) {
    return staleConnectionRetryAttempts
  }
  if (isAvailabilityError(error)) return unavailableRetryAttempts
  return 0
}

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds))

const useTextProtocol = readDatabaseUseTextProtocol()
console.info('[prisma] MariaDB protocol mode', {
  mode: useTextProtocol ? 'text-query' : 'binary-execute',
})

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaMariaDb(buildDatabaseConfig(databaseUrl), {
      useTextProtocol,
    }),
  })
globalForPrisma.prisma = basePrisma

export const prisma = basePrisma.$extends({
  name: 'transient-database-retry',
  query: {
    async $allOperations({ model, operation, args, query }) {
      // Fail fast only for confirmed acquisition outages.
      if (circuitIsOpen()) {
        throw new Error(CIRCUIT_OPEN_MESSAGE)
      }

      for (let attempt = 0; ; attempt += 1) {
        try {
          const result = await query(args)
          recordConnectionSuccess()
          return result
        } catch (error: unknown) {
          const availabilityError = isAvailabilityError(error)
          const staleConnectionError = isStaleDatabaseConnectionError(error)
          const retryLimit = retryLimitFor(error)

          if (availabilityError) {
            recordAvailabilityFailure()
          }

          if (
            (!availabilityError && !staleConnectionError) ||
            attempt >= retryLimit ||
            (availabilityError && circuitIsOpen())
          ) {
            throw error
          }

          const retryNumber = attempt + 1
          const waitMs = transientRetryDelayMs * retryNumber
          console.warn('[prisma:transient-retry]', {
            model: model ?? 'raw',
            operation,
            kind: staleConnectionError ? 'stale-connection' : 'unavailable',
            retry: retryNumber,
            maxRetries: retryLimit,
            waitMs,
            message: errorMessage(error),
          })
          await delay(waitMs)
        }
      }
    },
  },
})

export default prisma
