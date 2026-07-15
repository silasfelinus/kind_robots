// /server/utils/prisma.ts
import { PrismaClient } from '~/prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import {
  checkServerIdentity,
  type ConnectionOptions as TlsConnectionOptions,
} from 'node:tls'

type PrismaMariaDbConfig = ConstructorParameters<typeof PrismaMariaDb>[0]

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
    3_000,
  )
  const acquireTimeout = readPositiveInteger(
    process.env.DATABASE_ACQUIRE_TIMEOUT_MS,
    3_000,
  )
  const connectionLimit = readPositiveInteger(
    process.env.DATABASE_CONNECTION_LIMIT,
    2,
  )
  const minDelayValidation = readNonNegativeInteger(
    process.env.DATABASE_MIN_DELAY_VALIDATION_MS,
    0,
  )
  const idleTimeout = readPositiveInteger(
    process.env.DATABASE_IDLE_TIMEOUT_SECONDS,
    30,
  )
  const minimumIdle = readNonNegativeInteger(
    process.env.DATABASE_MINIMUM_IDLE,
    0,
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

  // Every warm Vercel function has its own pool. A default pool of ten lets a
  // small traffic burst multiply into hundreds of database sockets. Keep the
  // pool elastic and small; all values remain overridable through environment
  // variables for non-serverless deployments.
  if (!parsed.searchParams.has('idleTimeout')) {
    parsed.searchParams.set('idleTimeout', String(idleTimeout))
  }

  if (!parsed.searchParams.has('minimumIdle')) {
    parsed.searchParams.set('minimumIdle', String(minimumIdle))
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

function buildDatabaseConfig(url: string): PrismaMariaDbConfig {
  const resolvedUrl = buildDatabaseUrl(url)
  const sslCa = readDatabaseSslCa()
  const rejectUnauthorized = readSslRejectUnauthorized()

  // No CA and full verification requested → nothing to customize; hand the
  // adapter the plain URL (unchanged default behavior).
  if (!sslCa && rejectUnauthorized) return resolvedUrl

  const parsed = new URL(resolvedUrl)
  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''))
  const tlsOptions: TlsConnectionOptions = rejectUnauthorized
    ? {
        ca: sslCa,
        rejectUnauthorized: true,
        checkServerIdentity: (_connectorHostname, certificate) =>
          checkServerIdentity(parsed.hostname, certificate),
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

  return {
    host: parsed.hostname,
    port: readPositiveInteger(parsed.port, 3_306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    connectTimeout: readPositiveInteger(
      parsed.searchParams.get('connectTimeout') ?? undefined,
      3_000,
    ),
    acquireTimeout: readPositiveInteger(
      parsed.searchParams.get('acquireTimeout') ?? undefined,
      3_000,
    ),
    connectionLimit: readPositiveInteger(
      parsed.searchParams.get('connectionLimit') ?? undefined,
      2,
    ),
    minDelayValidation: readNonNegativeInteger(
      parsed.searchParams.get('minDelayValidation') ?? undefined,
      0,
    ),
    idleTimeout: readPositiveInteger(
      parsed.searchParams.get('idleTimeout') ?? undefined,
      30,
    ),
    minimumIdle: readNonNegativeInteger(
      parsed.searchParams.get('minimumIdle') ?? undefined,
      0,
    ),
    ssl: tlsOptions,
  }
}

const retryableDatabaseMessages = [
  'Cannot execute new commands: connection closed',
  'pool timeout: failed to retrieve a connection from pool',
  'Max connect timeout reached',
]

// A pool acquisition can consume the full acquireTimeout. Keep the default
// retry budget within the serverless function deadline instead of allowing the
// platform to terminate the request before errorHandler can return a 503.
// One retry, not two: when the wall is down every attempt burns the full
// acquireTimeout, and a 3x retry turned a single dead request into ~18s of held
// serverless concurrency — which is what produced the 504 gateway timeouts.
const transientRetryAttempts = readNonNegativeInteger(
  process.env.DATABASE_TRANSIENT_RETRY_ATTEMPTS,
  1,
)
const transientRetryDelayMs = readPositiveInteger(
  process.env.DATABASE_TRANSIENT_RETRY_DELAY_MS,
  100,
)

// Circuit breaker. When the pool cannot hand out a connection (ProxySQL/MariaDB
// saturated or unreachable), every request otherwise waits the full
// acquireTimeout before failing. After `breakerThreshold` consecutive connection
// failures we "open" the breaker for `breakerCooldownMs` and fail fast — freeing
// serverless slots (no more 504 pile-up) and letting the wall recover instead of
// being hammered by retries. State is per warm instance, held on globalThis so it
// survives across invocations on a reused Lambda.
const breakerThreshold = readPositiveInteger(
  process.env.DATABASE_BREAKER_THRESHOLD,
  5,
)
const breakerCooldownMs = readPositiveInteger(
  process.env.DATABASE_BREAKER_COOLDOWN_MS,
  10_000,
)

const breaker: CircuitBreakerState =
  globalForPrisma.prismaBreaker ?? { failures: 0, openUntil: 0 }
globalForPrisma.prismaBreaker = breaker

// Message is intentionally one the errorHandler classifies as a transient DB
// error, so a fast-failed request still returns a clean 503 (not a 500).
const CIRCUIT_OPEN_MESSAGE =
  'pool timeout: failed to retrieve a connection from pool (circuit open)'

function circuitIsOpen(): boolean {
  if (breaker.openUntil === 0) return false

  if (Date.now() >= breaker.openUntil) {
    // Cooldown elapsed: half-open. Allow the next request through as a probe;
    // recordSuccess/recordFailure below will close it or re-open it.
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

function recordConnectionFailure(): void {
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

function isRetryableDatabaseError(error: unknown): boolean {
  const message = errorMessage(error)
  return retryableDatabaseMessages.some((candidate) => message.includes(candidate))
}

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds))

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaMariaDb(buildDatabaseConfig(databaseUrl)),
  })
globalForPrisma.prisma = basePrisma

export const prisma = basePrisma.$extends({
  name: 'transient-database-retry',
  query: {
    async $allOperations({ model, operation, args, query }) {
      // Fail fast while the breaker is open instead of blocking on the pool.
      if (circuitIsOpen()) {
        throw new Error(CIRCUIT_OPEN_MESSAGE)
      }

      for (let attempt = 0; ; attempt += 1) {
        try {
          const result = await query(args)
          recordConnectionSuccess()
          return result
        } catch (error: unknown) {
          const retryable = isRetryableDatabaseError(error)
          if (retryable) {
            recordConnectionFailure()
          }

          if (
            !retryable ||
            attempt >= transientRetryAttempts ||
            circuitIsOpen()
          ) {
            throw error
          }

          const retryNumber = attempt + 1
          const waitMs = transientRetryDelayMs * retryNumber
          console.warn('[prisma:transient-retry]', {
            model: model ?? 'raw',
            operation,
            retry: retryNumber,
            maxRetries: transientRetryAttempts,
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
