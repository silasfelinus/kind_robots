// /scripts/lib/databaseRetry.ts
//
// Shared database client and bounded retry policy for idempotent production
// maintenance scripts. ProxySQL can briefly have no connection available while
// concurrent deployments are starting; a fresh client on retry avoids treating
// that transient pool window as a permanent deployment failure.

import { PrismaClient } from '../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from '../../server/utils/databaseAdapterConfig'

const TRANSIENT_CODES = new Set(['P1001', 'P1002', 'P1017', 'P2024'])

export function createScriptPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is missing')
  return new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })
}

export function isTransientDatabaseError(error: unknown): boolean {
  const value = error as {
    code?: unknown
    message?: unknown
    meta?: { message?: unknown; driverAdapterError?: { message?: unknown } }
  }
  const code = String(value?.code || '')
  const message = [
    value?.message,
    value?.meta?.message,
    value?.meta?.driverAdapterError?.message,
    error,
  ]
    .map((part) => String(part || ''))
    .join(' ')

  return (
    TRANSIENT_CODES.has(code) ||
    /pool timeout|failed to retrieve a connection|connect(?:ion)? timeout|connection (?:closed|refused|reset)/i.test(
      message,
    )
  )
}

export async function withDatabaseRetry<T>(
  label: string,
  operation: (attempt: number) => Promise<T>,
  maxAttempts = 3,
  retryDelayMs = 2_000,
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation(attempt)
    } catch (error) {
      lastError = error
      if (attempt >= maxAttempts || !isTransientDatabaseError(error)) {
        throw error
      }

      const delayMs = attempt * retryDelayMs
      console.warn(
        `[database-retry] ${label} attempt ${attempt}/${maxAttempts} hit a transient connection error; retrying in ${delayMs}ms.`,
      )
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  throw lastError
}
