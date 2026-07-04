// /server/utils/prisma.ts
import { PrismaClient } from '~/prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

// The mariadb driver's default connectTimeout is 1000ms; the database host is
// sometimes slower than that to accept a socket (confirmed from GitHub Actions
// runners), which surfaces as spurious "pool timeout" 5xx. 5s allows a retry
// within the pool's 10s acquire window. Query params survive the adapter's
// mysql:// → mariadb:// rewrite; an explicit connectTimeout in DATABASE_URL
// still wins.
const withConnectTimeout = (url: string, ms: number): string => {
  const parsed = new URL(url)
  if (!parsed.searchParams.has('connectTimeout')) {
    parsed.searchParams.set('connectTimeout', String(ms))
  }
  return parsed.toString()
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaMariaDb(withConnectTimeout(databaseUrl, 5_000)),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
