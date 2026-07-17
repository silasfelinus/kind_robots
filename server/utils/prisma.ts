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

type DatabasePoolOverrides = {
  connectionLimit?: number
  idleTimeout?: number
  minimumIdle?: number
  minDelayValidation?: number
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaBreaker?: CircuitBreakerState
  prismaAdapterPoisoned?: boolean
  prismaOneShotQueue?: Promise<void>
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

function buildDatabaseConfig(
  url: string,
  overrides: DatabasePoolOverrides = {},
): PrismaMariaDbPoolConfig {
  const parsed = new URL(url)
  const sslCa = readDatabaseSslCa()
  const rejectUnauthorized = readSslRejectUnauthorized()
  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''))
  const connectTimeout = readPositiveInteger(
    parsed.searchParams.get('connectTimeout') ??
      process.env.DATABASE_CONNECT_TIMEOUT_MS,
    DEFAULT_CONNECT_TIMEOUT_MS,
  )
  const acquireTimeout = readPositiveInteger(
    parsed.searchParams.get('acquireTimeout') ??
      process.env.DATABASE_ACQUIRE_TIMEOUT_MS,
    DEFAULT_ACQUIRE_TIMEOUT_MS,
  )
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
    connectTimeout,
    acquireTimeout,
    connectionLimit:
      overrides.connectionLimit ??
      readPositiveInteger(
        parsed.searchParams.get('connectionLimit') ??
          process.env.DATABASE_CONNECTION_LIMIT,
        DEFAULT_CONNECTION_LIMIT,
      ),
    minDelayValidation:
      overrides.minDelayValidation ??
      readNonNegativeInteger(
        parsed.searchParams.get('minDelayValidation') ??
          process.env.DATABASE_MIN_DELAY_VALIDATION_MS,
        0,
      ),
    idleTimeout:
      overrides.idleTimeout ??
      readPositiveInteger(
        parsed.searchParams.get('idleTimeout') ??
          process.env.DATABASE_IDLE_TIMEOUT_SECONDS,
        DEFAULT_IDLE_TIMEOUT_SECONDS,
      ),
    minimumIdle:
      overrides.minimumIdle ??
      readNonNegativeInteger(
        parsed.searchParams.get('minimumIdle') ??
          process.env.DATABASE_MINIMUM_IDLE,
        DEFAULT_MINIMUM_IDLE,
      ),
    ...(sslCa || !rejectUnauthorized ? { ssl: tlsOptions } : {}),
  }

  Object.assign(poolConfig, {
    pingTimeout: readPositiveInteger(
      parsed.searchParams.get('pingTimeout') ??
        process.env.DATABASE_PING_TIMEOUT_MS,
      DEFAULT_PING_TIMEOUT_MS,
    ),
    initializationTimeout: acquireTimeout,
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

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds))

const useTextProtocol = readDatabaseUseTextProtocol()

function createPrismaClient(
  poolOverrides: DatabasePoolOverrides = {},
): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaMariaDb(
      buildDatabaseConfig(databaseUrl, poolOverrides),
      { useTextProtocol },
    ),
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

  if (
    !delegate ||
    (typeof delegate !== 'object' && typeof delegate !== 'function')
  ) {
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

const oneShotPoolOverrides: DatabasePoolOverrides = {
  connectionLimit: 1,
  minimumIdle: 1,
  idleTimeout: 30,
  minDelayValidation: 500,
}

async function serializeOneShotOperation<T>(
  operation: () => Promise<T>,
): Promise<T> {
  const previous = globalForPrisma.prismaOneShotQueue ?? Promise.resolve()
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const current = previous.catch(() => undefined).then(() => gate)

  globalForPrisma.prismaOneShotQueue = current
  await previous.catch(() => undefined)

  try {
    return await operation()
  } finally {
    release()

    if (globalForPrisma.prismaOneShotQueue === current) {
      globalForPrisma.prismaOneShotQueue = undefined
    }
  }
}

async function runOneShotPrismaOperation(
  model: string,
  operation: string,
  args: unknown,
  reason: string,
): Promise<unknown> {
  return serializeOneShotOperation(async () => {
    const oneShotPrisma = createPrismaClient(oneShotPoolOverrides)

    console.warn('[prisma:one-shot-fallback]', {
      model,
      operation,
      reason,
      mode: useTextProtocol ? 'text-query' : 'binary-execute',
    })

    try {
      await oneShotPrisma.$connect()
      await oneShotPrisma.$queryRawUnsafe('SELECT 1 AS prisma_one_shot_ready')

      console.warn('[prisma:one-shot-ready]', {
        model,
        operation,
      })

      const result = await replayPrismaOperation(
        oneShotPrisma,
        model,
        operation,
        args,
      )
      recordConnectionSuccess()
      return result
    } finally {
      await oneShotPrisma.$disconnect().catch((disconnectError: unknown) => {
        console.warn('[prisma:one-shot-disconnect-failed]', {
          model,
          operation,
          message: errorMessage(disconnectError),
        })
      })
    }
  })
}

const basePrisma = globalForPrisma.prisma ?? createPrismaClient()
globalForPrisma.prisma = basePrisma

function extendPrismaClient(client: PrismaClient) {
  return client.$extends({
    name: 'transient-database-retry',
    query: {
      async $allOperations({ model, operation, args, query }) {
        const transactionActive = transactionContext.getStore() === true

        if (
          globalForPrisma.prismaAdapterPoisoned &&
          model &&
          !transactionActive
        ) {
          return (await runOneShotPrismaOperation(
            model,
            operation,
            args,
            'shared adapter already marked poisoned',
          )) as ReturnType<typeof query>
        }

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

            if (staleConnectionError) {
              globalForPrisma.prismaAdapterPoisoned = true

              console.warn('[prisma:adapter-poisoned]', {
                model: model ?? 'raw',
                operation,
                transactionActive,
                message: errorMessage(error),
              })

              if (!model || transactionActive) throw error

              return (await runOneShotPrismaOperation(
                model,
                operation,
                args,
                `${model}.${operation}: ${errorMessage(error)}`,
              )) as ReturnType<typeof query>
            }

            if (!availabilityError) throw error

            recordAvailabilityFailure()

            if (
              attempt >= unavailableRetryAttempts ||
              circuitIsOpen()
            ) {
              throw error
            }

            const retryNumber = attempt + 1
            const waitMs = transientRetryDelayMs * retryNumber

            console.warn('[prisma:transient-retry]', {
              model: model ?? 'raw',
              operation,
              kind: 'unavailable',
              retry: retryNumber,
              maxRetries: unavailableRetryAttempts,
              waitMs,
              message: errorMessage(error),
            })

            await delay(waitMs)
          }
        }
      },
    },
  })
}

type RetryingPrismaClient = ReturnType<typeof extendPrismaClient>
const activePrisma = extendPrismaClient(basePrisma)

console.info('[prisma] MariaDB protocol mode', {
  mode: useTextProtocol ? 'text-query' : 'binary-execute',
  oneShotFallback: globalForPrisma.prismaAdapterPoisoned ?? false,
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
