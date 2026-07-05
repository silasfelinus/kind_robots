// /server/utils/davinci.ts
//
// Da Vinci life-sim ending resolution. The app owns this math — AI narration
// may generate prose and choices, but the outcomeKey, ending lookup, and
// award records come from here.
//
// Bit order matches conductor's projects/davinci/data/ending-dimensions.yaml
// and scripts/generate_davinci_endings.py: outcomeKey[i] is DIMENSIONS[i],
// '1' = pass. Do not reorder without migrating the seeded endings.

import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from './prisma'

export const DAVINCI_DIMENSIONS = [
  'legacy',
  'wealth',
  'love',
  'wisdom',
  'health',
  'freedom',
  'fame',
  'creation',
  'community',
  'mystery',
] as const

export type DaVinciDimension = (typeof DAVINCI_DIMENSIONS)[number]

// A dimension passes when its stat value meets this threshold
// (ending-dimensions.yaml threshold.default_pass_value). Missing stats fail.
export const DAVINCI_PASS_VALUE = 1

export function resolveOutcomeKey(
  stats: Partial<Record<string, number>>,
  passValue: number = DAVINCI_PASS_VALUE,
): string {
  return DAVINCI_DIMENSIONS.map((key) =>
    (stats[key] ?? 0) >= passValue ? '1' : '0',
  ).join('')
}

export interface ResolveLifeRunResult {
  outcomeKey: string
  stats: Record<string, number>
  ending: { id: number; title: string; slug: string; victoryType: string }
  milestoneId: number | null
  milestoneRecordId: number | null
  milestoneAwarded: boolean
  achievementId: number | null
  unlockId: number | null
  achievementAwarded: boolean
}

// Resolves a LifeRun's stats into its deterministic ending and awards the
// linked Milestone + LifeAchievement. Idempotent: re-resolving an already
// completed run re-derives the same ending and awards nothing twice.
//
// Duplicate-unlock guard: LifeAchievementUnlock's unique
// (userId, achievementId, lifeRunId) does NOT protect global uniqueness —
// MySQL treats each NULL lifeRunId as distinct, and different runs reaching
// the same ending would each satisfy the constraint. Ending achievements are
// one-per-user, so we guard on (userId, achievementId) here at the API layer.
export async function resolveLifeRunEnding(
  lifeRunId: number,
  userId: number,
  username?: string | null,
): Promise<ResolveLifeRunResult> {
  return prisma.$transaction(async (tx) => {
    const run = await tx.lifeRun.findUnique({
      where: { id: lifeRunId },
      include: { Stats: true },
    })
    if (!run) {
      const error = new Error(`LifeRun ${lifeRunId} does not exist.`)
      ;(error as Error & { statusCode?: number }).statusCode = 404
      throw error
    }
    if (run.userId !== userId) {
      const error = new Error(
        'LifeRun does not belong to the authenticated user.',
      )
      ;(error as Error & { statusCode?: number }).statusCode = 403
      throw error
    }

    const stats: Record<string, number> = {}
    for (const stat of run.Stats) stats[stat.key] = stat.value
    const outcomeKey = resolveOutcomeKey(stats)

    const ending = await tx.lifeEnding.findUnique({
      where: { outcomeKey },
    })
    if (!ending) {
      const error = new Error(
        `No LifeEnding seeded for outcomeKey ${outcomeKey}. Run the Da Vinci seed importer first.`,
      )
      ;(error as Error & { statusCode?: number }).statusCode = 404
      throw error
    }

    await tx.lifeRun.update({
      where: { id: run.id },
      data: {
        outcomeKey,
        endingId: ending.id,
        status: 'COMPLETE',
        statsSnapshot: stats as Prisma.InputJsonValue,
      },
    })

    // Award the linked Milestone (davinci-ending-{outcomeKey}) once per user.
    let milestoneRecordId: number | null = null
    let milestoneAwarded = false
    if (ending.milestoneId) {
      const existingRecord = await tx.milestoneRecord.findFirst({
        where: { milestoneId: ending.milestoneId, userId },
        select: { id: true },
      })
      if (existingRecord) {
        milestoneRecordId = existingRecord.id
      } else {
        const record = await tx.milestoneRecord.create({
          data: {
            milestoneId: ending.milestoneId,
            userId,
            username: username ?? null,
          },
        })
        milestoneRecordId = record.id
        milestoneAwarded = true
      }
    }

    // Award the linked LifeAchievement once per user (global guard — see above).
    let achievementId: number | null = null
    let unlockId: number | null = null
    let achievementAwarded = false
    const achievement = await tx.lifeAchievement.findFirst({
      where: { endingId: ending.id, isActive: true },
      select: { id: true },
    })
    if (achievement) {
      achievementId = achievement.id
      const existingUnlock = await tx.lifeAchievementUnlock.findFirst({
        where: { userId, achievementId: achievement.id },
        select: { id: true },
      })
      if (existingUnlock) {
        unlockId = existingUnlock.id
      } else {
        const unlock = await tx.lifeAchievementUnlock.create({
          data: {
            userId,
            achievementId: achievement.id,
            lifeRunId: run.id,
            milestoneRecordId,
            data: { outcomeKey },
          },
        })
        unlockId = unlock.id
        achievementAwarded = true
      }
    }

    return {
      outcomeKey,
      stats,
      ending: {
        id: ending.id,
        title: ending.title,
        slug: ending.slug,
        victoryType: ending.victoryType,
      },
      milestoneId: ending.milestoneId,
      milestoneRecordId,
      milestoneAwarded,
      achievementId,
      unlockId,
      achievementAwarded,
    }
  })
}
