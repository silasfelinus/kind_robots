// /server/utils/prisma.ts
import { PrismaClient } from '~/prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { AsyncLocalStorage } from 'node:async_hooks'
import type { ConnectionOptions as TlsConnectionOptions } from 'node:tls'
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
  prismaRecovery?: Promise<PrismaClient>
  prismaGeneration?: number
}

const configuredDatabaseUrl = process.env.DATABASE_URL

if (!configuredDatabaseUrl) {
  throw new Error('DATABASE_URL is missing')
}

const databaseUrl: string = configuredDatabaseUrl
const transactionContext = new AsyncLocalStorage<boolean>()

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

  if (!parsed.searchParams.has('idleTimeout')) {
    parsed.searchParams.set('idleTimeout', String(idleTimeout))
  }

  if (!parsed.searchParams.has('minimumIdle')) {
    parsed.searchParams.set('minimumIdle', String(minimumIdle))
  }

  if (!parsed.searchParams.has('pingTimeout')) {
    parsed.searchParams.set('pingTimeout', String(pingTimeout))
  }

  if (!parsed.searchParams.has('pipelining')) {
    parsed.searchParams.set('pipelining', String(readDatabasePipelining()))
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

function readSslRejectUnauthorized(): boolean {
  const raw = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED?.trim().toLowerCase()
  return raw !== 'false' && raw !== '0' && raw !== 'no'
}

function readDatabaseUseTextProtocol(): boolean {
  const raw = process.env.DATABASE_USE_TEXT_PROTOCOL?.trim().toLowerCase()
  return raw !== 'false' && raw !== '0' && raw !== 'no'
}

// ProxySQL's frontend does not support MySQL command pipelining. When the
// MariaDB connector sends a second command while ProxySQL is still processing
// the previous one on the same session, ProxySQL logs
// "Unexpected packet from client ... Session_status: 6 ... Disconnecting it",
// closes the frontend socket, and KILLs the backend query. That surfaced as
// deterministic "Cannot execute new commands: connection closed" 503s on every
// create/update whose Prisma plan runs multiple statements in one transaction
// (an INSERT followed by the relation SELECTs of an `include`), while lean
// single-statement writes and all reads went through fine — and it reproduced
// only over the TLS ProxySQL path, never on a direct MariaDB connection (see
// scripts/db-write-repro.mjs and issue #324). The connector pipelines by
// default; disable it for this topology. Set DATABASE_PIPELINING=true to
// restore pipelining (e.g. for a direct-to-MariaDB link with no ProxySQL).
function readDatabasePipelining(): boolean {
  const raw = process.env.DATABASE_PIPELINING?.trim().toLowerCase()
  return raw === 'true' || raw === '1' || raw === 'yes'
}

function buildDatabaseConfig(url: string): PrismaMariaDbConfig {
  const resolvedUrl = buildDatabaseUrl(url)
  const sslCa = readDatabaseSslCa()
  const rejectUnauthorized = readSslRejectUnauthorized()

  if (!sslCa && rejectUnauthorized) return resolvedUrl

  const parsed = new URL(resolvedUrl)
  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''))
  const tlsOptions: TlsConnectionOptions = rejectUnauthorized
    ? {
        ca: sslCa,
        rejectUnauthorized: true,
      }
    : {
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

  Object.assign(poolConfig, {
    pingTimeout: readPositiveInteger(
      parsed.searchParams.get('pingTimeout') ?? undefined,
      DEFAULT_PING_TIMEOUT_MS,
    ),
    // Off by default for the ProxySQL topology — see readDatabasePipelining().
    pipelining: readDatabasePipelining(),
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

function createBasePrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaMariaDb(buildDatabaseConfig(databaseUrl), {
      useTextProtocol,
    }),
  })
}

async function replayPrismaOperation(
  client: PrismaClient,
  model: string,
  operation: string,
  args: unknown,
): Promise<unknown> {
  const delegateName = `${model.charAt(0).toLowerCase()}${model.slice(1)}`
  const delegate = (client as unknown as Record<string, unknown>)[delegateName]

  if (!delegate || (typeof delegate !== 'object' && typeof delegate !== 'function')) {
    throw new Error(`Unable to replay Prisma operation for model ${model}.`)
  }

  const method = (delegate as Record<string, unknown>)[operation]

  if (typeof method !== 'function') {
    throw new Error(`Unable to replay Prisma operation ${model}.${operation}.`)
  }

  return await (
    method as (this: unknown, input: unknown) => Promise<unknown>
  ).call(delegate, args)
}

let activeBasePrisma = globalForPrisma.prisma ?? createBasePrismaClient()
globalForPrisma.prisma = activeBasePrisma

type RetryingPrismaClient = ReturnType<typeof extendPrismaClient>
let activePrisma: RetryingPrismaClient

async function recyclePrismaClient(reason: string): Promise<PrismaClient> {
  const existingRecovery = globalForPrisma.prismaRecovery
  if (existingRecovery) return await existingRecovery

  const recovery = (async () => {
    const replacement = createBasePrismaClient()
    await replacement.$connect()

    activeBasePrisma = replacement
    globalForPrisma.prisma = replacement
    activePrisma = extendPrismaClient(replacement)
    globalForPrisma.prismaGeneration =
      (globalForPrisma.prismaGeneration ?? 0) + 1

    console.warn('[prisma:client-recycled]', {
      generation: globalForPrisma.prismaGeneration,
      reason,
      mode: useTextProtocol ? 'text-query' : 'binary-execute',
    })

    return replacement
  })()

  globalForPrisma.prismaRecovery = recovery

  try {
    return await recovery
  } finally {
    if (globalForPrisma.prismaRecovery === recovery) {
      globalForPrisma.prismaRecovery = undefined
    }
  }
}

function extendPrismaClient(client: PrismaClient) {
  return client.$extends({
    name: 'transient-database-retry',
    query: {
      async $allOperations({ model, operation, args, query }) {
        if (circuitIsOpen()) {
          throw new Error(CIRCUIT_OPEN_MESSAGE)
        }

        let execute = () => query(args)

        for (let attempt = 0; ; attempt += 1) {
          try {
            const result = await execute()
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

            if (staleConnectionError && model) {
              const replacement = await recyclePrismaClient(
                `${model}.${operation}: ${errorMessage(error)}`,
              )

              if (transactionContext.getStore()) {
                throw error
              }

              execute = (() =>
                replayPrismaOperation(
                  replacement,
                  model,
                  operation,
                  args,
                ) as ReturnType<typeof query>) as typeof execute
            }
          }
        }
      },
    },
  })
}

activePrisma = extendPrismaClient(activeBasePrisma)

console.info('[prisma] MariaDB protocol mode', {
  mode: useTextProtocol ? 'text-query' : 'binary-execute',
  generation: globalForPrisma.prismaGeneration ?? 0,
})

export const prisma = new Proxy({} as RetryingPrismaClient, {
  get(_target, property) {
    const value = Reflect.get(activePrisma, property, activePrisma)

    if (property === '$transaction' && typeof value === 'function') {
      return (...args: unknown[]) =>
        transactionContext.run(true, () =>
          Reflect.apply(value, activePrisma, args),
        )
    }

    return typeof value === 'function' ? value.bind(activePrisma) : value
  },
})

export default prisma
