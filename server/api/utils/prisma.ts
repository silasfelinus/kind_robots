// /server/api/utils/prisma.ts
import { Prisma, PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const datasourceUrl =
  typeof process.env.DATABASE_URL === 'string' &&
  process.env.DATABASE_URL.trim().length > 0
    ? process.env.DATABASE_URL.trim()
    : undefined

const devLog: Prisma.LogLevel[] = ['error', 'warn']

const prismaOptions: Prisma.PrismaClientOptions = {
  ...(datasourceUrl ? { datasourceUrl } : {}),
  log: process.env.NODE_ENV === 'production' ? [] : devLog,
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
