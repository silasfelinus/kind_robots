// /server/utils/prisma.ts
import { PrismaClient } from '~/prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
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

function buildDatabaseUrl(url: string): string {
  const parsed = new URL(url)
  const connectTimeout = readPositiveInteger(
    process.env.DATABASE_CONNECT_TIMEOUT_MS,
    5_000,
  )
  const acquireTimeout = readPositiveInteger(
    process.env.DATABASE_ACQUIRE_TIMEOUT_MS,
    10_000,
  )
  const connectionLimit = readPositiveInteger(
    process.env.DATABASE_CONNECTION_LIMIT,
    2,
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

  return parsed.toString()
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaMariaDb(buildDatabaseUrl(databaseUrl)),
  })

globalForPrisma.prisma = prisma

export default prisma
