// /server/utils/prisma.ts
import { PrismaClient } from '~/prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { AsyncLocalStorage } from 'node:async_hooks'
// SSL-aware adapter config (buildDatabaseConfig + the env readers) lives in a
// dedicated, side-effect-free module so the standalone maintenance scripts can
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
  prismaRecovery?: Promise<PrismaClient>
  prismaGeneration?: number
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
