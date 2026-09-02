import { createError } from 'h3'
import { Prisma } from '~/prisma/generated/prisma/client'
import prisma from './prisma'

const DEFAULT_PER_HUMAN_DAILY = 10
const DEFAULT_PUBLIC_DAILY_POOL = 1000
const DEFAULT_INTERNAL_DAILY_RESERVE = 500
const DEFAULT_MAX_DEFERRED_PER_HUMAN = 10

function positiveInt(raw: string | undefined, fallback: number, max: number): number {
  const value = Number(raw)
  return Number.isInteger(value) && value > 0 && value <= max ? value : fallback
}

export function krea2QuotaConfig() {
  return {
    perHumanDaily: positiveInt(
      process.env.KREA2_FREE_PER_HUMAN_DAILY,
      DEFAULT_PER_HUMAN_DAILY,
      1000,
    ),
    publicDailyPool: positiveInt(
      process.env.KREA2_PUBLIC_DAILY_POOL,
      DEFAULT_PUBLIC_DAILY_POOL,
      1_000_000,
    ),
    internalDailyReserve: positiveInt(
      process.env.KREA2_INTERNAL_DAILY_RESERVE,
      DEFAULT_INTERNAL_DAILY_RESERVE,
      1_000_000,
    ),
    maxDeferredPerHuman: positiveInt(
      process.env.KREA2_MAX_DEFERRED_PER_HUMAN,
      DEFAULT_MAX_DEFERRED_PER_HUMAN,
      1000,
    ),
  }
}

export function krea2QuotaDate(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}

export function krea2QuotaResetsAt(now = new Date()): string {
  const reset = new Date(now)
  reset.setUTCHours(24, 0, 0, 0)
  return reset.toISOString()
}

type RawCount = { used: number | bigint }
type DeferredRow = {
  artJobId: number
  userId: number
  agentProfileId: number | null
  credentialId: number | null
}

type QuotaAudit = {
  userId: number
  agentProfileId?: number | null
  credentialId?: number | null
}

export type Krea2QuotaStatus = {
  quotaDate: string
  resetsAt: string
  perHumanDaily: number
  userUsed: number
  userRemaining: number
  publicDailyPool: number
  publicUsed: number
  publicRemaining: number
  internalDailyReserve: number
  deferredForUser: number
}

async function ensureCounterRows(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  quotaDate: string,
  userId: number,
) {
  await tx.$executeRaw(Prisma.sql`
    INSERT INTO Krea2DailyUserQuota (quotaDate, userId, used, updatedAt)
    VALUES (${quotaDate}, ${userId}, 0, CURRENT_TIMESTAMP(3))
    ON DUPLICATE KEY UPDATE quotaDate = VALUES(quotaDate)
  `)
  await tx.$executeRaw(Prisma.sql`
    INSERT INTO Krea2DailyPublicPool (quotaDate, used, updatedAt)
    VALUES (${quotaDate}, 0, CURRENT_TIMESTAMP(3))
    ON DUPLICATE KEY UPDATE quotaDate = VALUES(quotaDate)
  `)
}

async function lockedUsage(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  quotaDate: string,
  userId: number,
): Promise<{ userUsed: number; publicUsed: number }> {
  const userRows = await tx.$queryRaw<RawCount[]>(Prisma.sql`
    SELECT used
    FROM Krea2DailyUserQuota
    WHERE quotaDate = ${quotaDate} AND userId = ${userId}
    FOR UPDATE
  `)
  const publicRows = await tx.$queryRaw<RawCount[]>(Prisma.sql`
    SELECT used
    FROM Krea2DailyPublicPool
    WHERE quotaDate = ${quotaDate}
    FOR UPDATE
  `)
  return {
    userUsed: Number(userRows[0]?.used ?? 0),
    publicUsed: Number(publicRows[0]?.used ?? 0),
  }
}

async function incrementUsage(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  quotaDate: string,
  userId: number,
) {
  await tx.$executeRaw(Prisma.sql`
    UPDATE Krea2DailyUserQuota
    SET used = used + 1, updatedAt = CURRENT_TIMESTAMP(3)
    WHERE quotaDate = ${quotaDate} AND userId = ${userId}
  `)
  await tx.$executeRaw(Prisma.sql`
    UPDATE Krea2DailyPublicPool
    SET used = used + 1, updatedAt = CURRENT_TIMESTAMP(3)
    WHERE quotaDate = ${quotaDate}
  `)
}

export async function getKrea2QuotaStatus(userId: number): Promise<Krea2QuotaStatus> {
  const quotaDate = krea2QuotaDate()
  const config = krea2QuotaConfig()
  const [userRows, publicRows, deferredRows] = await Promise.all([
    prisma.$queryRaw<RawCount[]>(Prisma.sql`
      SELECT used FROM Krea2DailyUserQuota
      WHERE quotaDate = ${quotaDate} AND userId = ${userId}
      LIMIT 1
    `),
    prisma.$queryRaw<RawCount[]>(Prisma.sql`
      SELECT used FROM Krea2DailyPublicPool
      WHERE quotaDate = ${quotaDate}
      LIMIT 1
    `),
    prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*) AS count FROM Krea2DeferredFreeJob WHERE userId = ${userId}
    `),
  ])
  const userUsed = Number(userRows[0]?.used ?? 0)
  const publicUsed = Number(publicRows[0]?.used ?? 0)
  return {
    quotaDate,
    resetsAt: krea2QuotaResetsAt(),
    perHumanDaily: config.perHumanDaily,
    userUsed,
    userRemaining: Math.max(0, config.perHumanDaily - userUsed),
    publicDailyPool: config.publicDailyPool,
    publicUsed,
    publicRemaining: Math.max(0, config.publicDailyPool - publicUsed),
    internalDailyReserve: config.internalDailyReserve,
    deferredForUser: Number(deferredRows[0]?.count ?? 0),
  }
}

export type Krea2EnqueueResult =
  | { mode: 'FREE_QUOTA'; job: { id: number }; reservationId: bigint }
  | { mode: 'DEFERRED_FREE'; job: { id: number } }
  | { mode: 'USER_LIMIT' }
  | { mode: 'DEFERRED_LIMIT' }

/**
 * Atomically decides the public-free path and creates the ArtJob. The daily
 * counters and reservation live in the same transaction as the job, so two
 * simultaneous agents for one human can never turn a 10/day allowance into 11.
 */
export async function enqueueKrea2PublicFreeJob(
  data: Prisma.ArtJobUncheckedCreateInput,
  audit: QuotaAudit,
): Promise<Krea2EnqueueResult> {
  const config = krea2QuotaConfig()
  const quotaDate = krea2QuotaDate()

  return await prisma.$transaction(async (tx) => {
    await ensureCounterRows(tx, quotaDate, audit.userId)
    const usage = await lockedUsage(tx, quotaDate, audit.userId)

    if (usage.userUsed >= config.perHumanDaily) {
      return { mode: 'USER_LIMIT' } as const
    }

    if (usage.publicUsed >= config.publicDailyPool) {
      const deferred = await tx.$queryRaw<Array<{ artJobId: number }>>(Prisma.sql`
        SELECT artJobId
        FROM Krea2DeferredFreeJob
        WHERE userId = ${audit.userId}
        ORDER BY artJobId ASC
        FOR UPDATE
      `)
      if (deferred.length >= config.maxDeferredPerHuman) {
        return { mode: 'DEFERRED_LIMIT' } as const
      }

      const job = await tx.artJob.create({ data })
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO Krea2DeferredFreeJob
          (artJobId, userId, agentProfileId, credentialId, createdAt)
        VALUES (
          ${job.id},
          ${audit.userId},
          ${audit.agentProfileId ?? null},
          ${audit.credentialId ?? null},
          CURRENT_TIMESTAMP(3)
        )
      `)
      return { mode: 'DEFERRED_FREE', job: { id: job.id } } as const
    }

    await incrementUsage(tx, quotaDate, audit.userId)
    const job = await tx.artJob.create({ data })
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO Krea2QuotaReservation
        (quotaDate, userId, agentProfileId, credentialId, artJobId, createdAt)
      VALUES (
        ${quotaDate},
        ${audit.userId},
        ${audit.agentProfileId ?? null},
        ${audit.credentialId ?? null},
        ${job.id},
        CURRENT_TIMESTAMP(3)
      )
    `)
    const reservationRows = await tx.$queryRaw<Array<{ id: bigint }>>(Prisma.sql`
      SELECT id FROM Krea2QuotaReservation WHERE artJobId = ${job.id} LIMIT 1
    `)
    return {
      mode: 'FREE_QUOTA',
      job: { id: job.id },
      reservationId: reservationRows[0]?.id ?? BigInt(0),
    } as const
  })
}

export async function getDeferredKrea2JobIds(jobIds: readonly number[]): Promise<Set<number>> {
  if (!jobIds.length) return new Set()
  const ids = Array.from(new Set(jobIds))
  const rows = await prisma.$queryRaw<Array<{ artJobId: number }>>(Prisma.sql`
    SELECT artJobId FROM Krea2DeferredFreeJob
    WHERE artJobId IN (${Prisma.join(ids)})
  `)
  return new Set(rows.map((row) => row.artJobId))
}

/**
 * Promote one deferred free job only when today's human and public pools both
 * have room. A deferred request owns no future credits; it competes for a fresh
 * daily slot when the relay sees it, so unused allowance never stockpiles.
 */
export async function tryPromoteDeferredKrea2Job(jobId: number): Promise<boolean> {
  const config = krea2QuotaConfig()
  const quotaDate = krea2QuotaDate()

  return await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<DeferredRow[]>(Prisma.sql`
      SELECT artJobId, userId, agentProfileId, credentialId
      FROM Krea2DeferredFreeJob
      WHERE artJobId = ${jobId}
      FOR UPDATE
    `)
    const deferred = rows[0]
    if (!deferred) return true

    await ensureCounterRows(tx, quotaDate, deferred.userId)
    const usage = await lockedUsage(tx, quotaDate, deferred.userId)
    if (
      usage.userUsed >= config.perHumanDaily ||
      usage.publicUsed >= config.publicDailyPool
    ) {
      return false
    }

    await incrementUsage(tx, quotaDate, deferred.userId)
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO Krea2QuotaReservation
        (quotaDate, userId, agentProfileId, credentialId, artJobId, createdAt)
      VALUES (
        ${quotaDate},
        ${deferred.userId},
        ${deferred.agentProfileId},
        ${deferred.credentialId},
        ${deferred.artJobId},
        CURRENT_TIMESTAMP(3)
      )
    `)
    await tx.$executeRaw(Prisma.sql`
      DELETE FROM Krea2DeferredFreeJob WHERE artJobId = ${deferred.artJobId}
    `)
    return true
  })
}

export async function releaseKrea2ReservationForJob(jobId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      Array<{ id: bigint; quotaDate: Date | string; userId: number }>
    >(Prisma.sql`
      SELECT id, quotaDate, userId
      FROM Krea2QuotaReservation
      WHERE artJobId = ${jobId}
      FOR UPDATE
    `)
    const row = rows[0]
    if (!row) return
    const quotaDate =
      row.quotaDate instanceof Date
        ? row.quotaDate.toISOString().slice(0, 10)
        : String(row.quotaDate).slice(0, 10)

    await tx.$executeRaw(Prisma.sql`
      DELETE FROM Krea2QuotaReservation WHERE id = ${row.id}
    `)
    await tx.$executeRaw(Prisma.sql`
      UPDATE Krea2DailyUserQuota
      SET used = GREATEST(used - 1, 0), updatedAt = CURRENT_TIMESTAMP(3)
      WHERE quotaDate = ${quotaDate} AND userId = ${row.userId}
    `)
    await tx.$executeRaw(Prisma.sql`
      UPDATE Krea2DailyPublicPool
      SET used = GREATEST(used - 1, 0), updatedAt = CURRENT_TIMESTAMP(3)
      WHERE quotaDate = ${quotaDate}
    `)
  })
}

export function deferredKrea2QueueError(): never {
  throw createError({
    statusCode: 429,
    message:
      'Your free Krea 2 queue is already full. No tokens were charged. Use your own generator server, use paid generation, or try again after queued work advances.',
  })
}
