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
    10,
  )
  const minDelayValidation = readNonNegativeInteger(
    process.env.DATABASE_MIN_DELAY_VALIDATION_MS,
    0,
  )
  const idleTimeout = readPositiveInteger(
    process.env.DATABASE_IDLE_TIMEOUT_SECONDS,
    15,
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

  // Vercel warm instances may sit idle longer than ProxySQL permits. Retire idle
  // sockets quickly and allow the tiny pool to reach zero so the next request
  // creates a fresh connection rather than borrowing two closed sockets.
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
  // adapter the URL with its bounded pool options.
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
      10,
    ),
    minDelayValidation: readNonNegativeInteger(
      parsed.searchParams.get('minDelayValidation') ?? undefined,
      0,
    ),
    idleTimeout: readPositiveInteger(
      parsed.searchParams.get('idleTimeout') ?? undefined,
      15,
    ),
    minimumIdle: readNonNegativeInteger(
      parsed.searchParams.get('minimumIdle') ?? undefined,
      0,
    ),
    ssl: tlsOptions,
  }
}

const staleConnectionMessages = [
  'Cannot execute new commands: connection closed',
]

const unavailableDatabaseMessages = [
  'pool timeout: failed to retrieve a connection from pool',
  'Max connect timeout reached',
]

// Acquisition failures consume the full timeout, so keep that retry budget at
// one. Closed pooled sockets fail immediately; with a two-slot pool, two fast
// retries let the adapter discard both stale sockets and create a fresh third
// connection attempt without extending an outage by several seconds.
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

const breaker: CircuitBreakerState =
  globalForPrisma.prismaBreaker ?? { failures: 0, openUntil: 0 }
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

function isStaleConnectionError(error: unknown): boolean {
  return messageMatches(error, staleConnectionMessages)
}

function isAvailabilityError(error: unknown): boolean {
  return messageMatches(error, unavailableDatabaseMessages)
}

function retryLimitFor(error: unknown): number {
  if (isStaleConnectionError(error)) return staleConnectionRetryAttempts
  if (isAvailabilityError(error)) return unavailableRetryAttempts
  return 0
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
          const staleConnectionError = isStaleConnectionError(error)
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
