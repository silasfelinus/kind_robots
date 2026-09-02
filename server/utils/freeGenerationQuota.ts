import { createError } from 'h3'
import { Prisma } from '~/prisma/generated/prisma/client'
import prisma from './prisma'

const POLICY_ID = 1
const MAX_DEFER_DAYS = 7
export const FREE_KREA2_QUEUE_PRIORITY = 50
export const PAID_GENERATION_PRIORITY_FLOOR = 100

export type GenerationQuotaPolicy = {
  enabled: boolean
  freeKrea2PerUser: number
  dailyCapacity: number
  internalReserve: number
  externalFreeLimit: number
}

export type FreeKrea2Allocation = {
  claimed: boolean
  day: string | null
  deferred: boolean
  reason: 'claimed' | 'disabled' | 'user-limit' | 'capacity-full'
  userUsed: number
  userLimit: number
  globalUsed: number
  globalLimit: number
}

type QuotaClient = Prisma.TransactionClient | typeof prisma

function nonNegativeInt(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

export function utcDay(offsetDays = 0): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

export async function getGenerationQuotaPolicy(
  client: QuotaClient = prisma,
): Promise<GenerationQuotaPolicy> {
  const rows = await client.$queryRaw<
    Array<{
      enabled: boolean | number
      freeKrea2PerUser: number
      dailyCapacity: number
      internalReserve: number
    }>
  >(Prisma.sql`
    SELECT enabled, freeKrea2PerUser, dailyCapacity, internalReserve
    FROM GenerationQuotaPolicy
    WHERE id = ${POLICY_ID}
    LIMIT 1
  `)

  const row = rows[0]
  const dailyCapacity = nonNegativeInt(row?.dailyCapacity, 1500)
  const internalReserve = Math.min(
    dailyCapacity,
    nonNegativeInt(row?.internalReserve, 500),
  )
  return {
    enabled: row ? Boolean(row.enabled) : true,
    freeKrea2PerUser: nonNegativeInt(row?.freeKrea2PerUser, 10),
    dailyCapacity,
    internalReserve,
    externalFreeLimit: Math.max(0, dailyCapacity - internalReserve),
  }
}

async function ensureQuotaRows(
  tx: Prisma.TransactionClient,
  day: string,
  userId: number,
): Promise<void> {
  await tx.$executeRaw(Prisma.sql`
    INSERT INTO FreeGenerationPoolDay (day, used, updatedAt)
    VALUES (${day}, 0, CURRENT_TIMESTAMP(3))
    ON DUPLICATE KEY UPDATE day = VALUES(day)
  `)
  await tx.$executeRaw(Prisma.sql`
    INSERT INTO FreeGenerationUserDay (day, userId, used, updatedAt)
    VALUES (${day}, ${userId}, 0, CURRENT_TIMESTAMP(3))
    ON DUPLICATE KEY UPDATE day = VALUES(day)
  `)
}

async function lockedUsage(
  tx: Prisma.TransactionClient,
  day: string,
  userId: number,
): Promise<{ globalUsed: number; userUsed: number }> {
  const globalRows = await tx.$queryRaw<Array<{ used: number }>>(Prisma.sql`
    SELECT used
    FROM FreeGenerationPoolDay
    WHERE day = ${day}
    FOR UPDATE
  `)
  const userRows = await tx.$queryRaw<Array<{ used: number }>>(Prisma.sql`
    SELECT used
    FROM FreeGenerationUserDay
    WHERE day = ${day} AND userId = ${userId}
    FOR UPDATE
  `)
  return {
    globalUsed: nonNegativeInt(globalRows[0]?.used, 0),
    userUsed: nonNegativeInt(userRows[0]?.used, 0),
  }
}

/**
 * Reserve one subsidized Krea2 slot. Personal daily exhaustion is a paid
 * overage boundary; global capacity exhaustion instead searches future days so
 * the accepted free job can remain queued without silently spending tokens or
 * an external paid API.
 */
export async function allocateFreeKrea2Slot(
  tx: Prisma.TransactionClient,
  input: { userId: number },
): Promise<FreeKrea2Allocation> {
  const policy = await getGenerationQuotaPolicy(tx)
  if (!policy.enabled || policy.freeKrea2PerUser <= 0 || policy.externalFreeLimit <= 0) {
    return {
      claimed: false,
      day: null,
      deferred: false,
      reason: 'disabled',
      userUsed: 0,
      userLimit: policy.freeKrea2PerUser,
      globalUsed: 0,
      globalLimit: policy.externalFreeLimit,
    }
  }

  for (let offset = 0; offset <= MAX_DEFER_DAYS; offset += 1) {
    const day = utcDay(offset)
    await ensureQuotaRows(tx, day, input.userId)
    const usage = await lockedUsage(tx, day, input.userId)

    // The user consumed today's personal allowance. Do not roll personal
    // overage into tomorrow for free: additional images are paid work.
    if (offset === 0 && usage.userUsed >= policy.freeKrea2PerUser) {
      return {
        claimed: false,
        day: null,
        deferred: false,
        reason: 'user-limit',
        userUsed: usage.userUsed,
        userLimit: policy.freeKrea2PerUser,
        globalUsed: usage.globalUsed,
        globalLimit: policy.externalFreeLimit,
      }
    }

    if (
      usage.userUsed < policy.freeKrea2PerUser &&
      usage.globalUsed < policy.externalFreeLimit
    ) {
      await tx.$executeRaw(Prisma.sql`
        UPDATE FreeGenerationUserDay
        SET used = used + 1, updatedAt = CURRENT_TIMESTAMP(3)
        WHERE day = ${day} AND userId = ${input.userId}
      `)
      await tx.$executeRaw(Prisma.sql`
        UPDATE FreeGenerationPoolDay
        SET used = used + 1, updatedAt = CURRENT_TIMESTAMP(3)
        WHERE day = ${day}
      `)
      return {
        claimed: true,
        day,
        deferred: offset > 0,
        reason: 'claimed',
        userUsed: usage.userUsed + 1,
        userLimit: policy.freeKrea2PerUser,
        globalUsed: usage.globalUsed + 1,
        globalLimit: policy.externalFreeLimit,
      }
    }
  }

  return {
    claimed: false,
    day: null,
    deferred: true,
    reason: 'capacity-full',
    userUsed: 0,
    userLimit: policy.freeKrea2PerUser,
    globalUsed: policy.externalFreeLimit,
    globalLimit: policy.externalFreeLimit,
  }
}

export async function recordFreeKrea2Claim(
  tx: Prisma.TransactionClient,
  input: {
    artJobId: number
    userId: number
    agentProfileId?: number | null
    day: string
  },
): Promise<void> {
  await tx.$executeRaw(Prisma.sql`
    INSERT INTO FreeGenerationClaim
      (artJobId, userId, agentProfileId, day, engine, createdAt)
    VALUES
      (${input.artJobId}, ${input.userId}, ${input.agentProfileId ?? null}, ${input.day}, 'krea2', CURRENT_TIMESTAMP(3))
  `)
}

export async function isFreeGenerationJobEligibleNow(artJobId: number): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ day: Date | string }>>(Prisma.sql`
    SELECT day
    FROM FreeGenerationClaim
    WHERE artJobId = ${artJobId}
    LIMIT 1
  `)
  if (!rows[0]) return true
  const day = String(rows[0].day).slice(0, 10)
  return day <= utcDay(0)
}

export async function getFreeGenerationQuotaStatus(userId: number) {
  const policy = await getGenerationQuotaPolicy()
  const day = utcDay(0)
  const [userRows, globalRows] = await Promise.all([
    prisma.$queryRaw<Array<{ used: number }>>(Prisma.sql`
      SELECT used FROM FreeGenerationUserDay
      WHERE day = ${day} AND userId = ${userId}
      LIMIT 1
    `),
    prisma.$queryRaw<Array<{ used: number }>>(Prisma.sql`
      SELECT used FROM FreeGenerationPoolDay
      WHERE day = ${day}
      LIMIT 1
    `),
  ])
  const userUsed = nonNegativeInt(userRows[0]?.used, 0)
  const globalUsed = nonNegativeInt(globalRows[0]?.used, 0)
  return {
    day,
    policy,
    user: {
      used: userUsed,
      limit: policy.freeKrea2PerUser,
      remaining: Math.max(0, policy.freeKrea2PerUser - userUsed),
    },
    global: {
      used: globalUsed,
      limit: policy.externalFreeLimit,
      remaining: Math.max(0, policy.externalFreeLimit - globalUsed),
    },
  }
}

export function assertValidGenerationQuotaPolicy(input: {
  enabled: unknown
  freeKrea2PerUser: unknown
  dailyCapacity: unknown
  internalReserve: unknown
}) {
  if (typeof input.enabled !== 'boolean') {
    throw createError({ statusCode: 400, message: 'enabled must be a boolean.' })
  }
  const freeKrea2PerUser = nonNegativeInt(input.freeKrea2PerUser, -1)
  const dailyCapacity = nonNegativeInt(input.dailyCapacity, -1)
  const internalReserve = nonNegativeInt(input.internalReserve, -1)
  if (freeKrea2PerUser < 0 || freeKrea2PerUser > 1000) {
    throw createError({ statusCode: 400, message: 'freeKrea2PerUser must be between 0 and 1000.' })
  }
  if (dailyCapacity < 0 || dailyCapacity > 1_000_000) {
    throw createError({ statusCode: 400, message: 'dailyCapacity is invalid.' })
  }
  if (internalReserve < 0 || internalReserve > dailyCapacity) {
    throw createError({ statusCode: 400, message: 'internalReserve must be between 0 and dailyCapacity.' })
  }
  return { enabled: input.enabled, freeKrea2PerUser, dailyCapacity, internalReserve }
}
