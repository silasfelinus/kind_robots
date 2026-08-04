// /server/utils/prisma.ts
import { PrismaClient } from '~/prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { AsyncLocalStorage } from 'node:async_hooks'
// SSL-aware adapter config (buildDatabaseConfig + the env readers) lives in a
// dedicated, side-effect-free module so standalone maintenance scripts can
// reuse the exact same ProxySQL TLS handshake this singleton uses.
import {
  buildDatabaseConfig,
  readDatabaseUseTextProtocol,
  readNonNegativeInteger,
  readPositiveInteger,
} from './databaseAdapterConfig'

type CircuitBreakerState = {
  failures: number
  openUntil: number
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaBreaker?: CircuitBreakerState
}

const configuredDatabaseUrl = process.env.DATABASE_URL

if (!configuredDatabaseUrl) {
  throw new Error('DATABASE_URL is missing')
}

const databaseUrl: string = configuredDatabaseUrl
const transactionContext = new AsyncLocalStorage<boolean>()

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
    // Never replay a statement within an active transaction. The caller must
    // receive the original error so Prisma can roll the transaction back.
    return transactionContext.getStore() ? 0 : staleConnectionRetryAttempts
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

function extendPrismaClient(client: PrismaClient) {
  return client.$extends({
    name: 'transient-database-retry',
    query: {
      async $allOperations({ model, operation, args, query }) {
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
}

// One base client means one MariaDB connector pool per warm Vercel runtime.
// Do not replace it during requests: retired Prisma clients retain their pools,
// and a replacement loop can strand another connectionLimit-sized pool each
// time a frontend socket fails. ProxySQL command pipelining is already disabled
// in databaseAdapterConfig.ts, which addresses the historical socket poison at
// its source.
const basePrisma = globalForPrisma.prisma ?? createBasePrismaClient()
globalForPrisma.prisma = basePrisma

const retryingPrisma = extendPrismaClient(basePrisma)
type RetryingPrismaClient = typeof retryingPrisma

console.info('[prisma] MariaDB adapter ready', {
  mode: useTextProtocol ? 'text-query' : 'binary-execute',
  poolLifecycle: 'singleton-per-runtime',
})

export const prisma = new Proxy({} as RetryingPrismaClient, {
  get(_target, property) {
    const value = Reflect.get(retryingPrisma, property, retryingPrisma)

    if (property === '$transaction' && typeof value === 'function') {
      return (...args: unknown[]) =>
        transactionContext.run(true, () =>
          Reflect.apply(value, retryingPrisma, args),
        )
    }

    return typeof value === 'function' ? value.bind(retryingPrisma) : value
  },
})

export default prisma
