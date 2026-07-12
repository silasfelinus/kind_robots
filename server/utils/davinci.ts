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
  achievementId: number | null
  achievementRecordId: number | null
  achievementAwarded: boolean
  lifeAchievementId: number | null
  unlockId: number | null
  lifeAchievementAwarded: boolean
}

// Resolves a LifeRun's stats into its deterministic ending and awards the
// linked Achievement + LifeAchievement. Idempotent: re-resolving an already
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

    // Award the linked Achievement (davinci-ending-{outcomeKey}) once per user.
    let achievementRecordId: number | null = null
    let achievementAwarded = false
    if (ending.achievementId) {
      const existingRecord = await tx.achievementRecord.findFirst({
        where: { achievementId: ending.achievementId, userId },
        select: { id: true },
      })
      if (existingRecord) {
        achievementRecordId = existingRecord.id
      } else {
        const record = await tx.achievementRecord.create({
          data: {
            achievementId: ending.achievementId,
            userId,
            username: username ?? null,
          },
        })
        achievementRecordId = record.id
        achievementAwarded = true
      }
    }

    // Award the linked LifeAchievement once per user (global guard — see above).
    let lifeAchievementId: number | null = null
    let unlockId: number | null = null
    let lifeAchievementAwarded = false
    const lifeAchievement = await tx.lifeAchievement.findFirst({
      where: { endingId: ending.id, isActive: true },
      select: { id: true },
    })
    if (lifeAchievement) {
      lifeAchievementId = lifeAchievement.id
      const existingUnlock = await tx.lifeAchievementUnlock.findFirst({
        where: { userId, achievementId: lifeAchievement.id },
        select: { id: true },
      })
      if (existingUnlock) {
        unlockId = existingUnlock.id
      } else {
        const unlock = await tx.lifeAchievementUnlock.create({
          data: {
            userId,
            achievementId: lifeAchievement.id,
            lifeRunId: run.id,
            achievementRecordId,
            data: { outcomeKey },
          },
        })
        unlockId = unlock.id
        lifeAchievementAwarded = true
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
      achievementId: ending.achievementId,
      achievementRecordId,
      achievementAwarded,
      lifeAchievementId,
      unlockId,
      lifeAchievementAwarded,
    }
  })
}

// --- Play loop (davinci/t-013) --------------------------------------------
//
// The durable-state substrate the Chat narrator will call later: create a run,
// record a choice with its stat effects, and read a run back for resume. AI
// narration is out of scope — these endpoints own state, not prose. Per the
// Storymaker boundary doc, this stays inside the Life* models; no shared
// session tables.

function withStatusCode(message: string, statusCode: number): Error {
  const error = new Error(message)
  ;(error as Error & { statusCode?: number }).statusCode = statusCode
  return error
}

export interface CreateLifeRunInput {
  title: string
  seed?: string | null
  protagonistName?: string | null
  genre?: string | null
  currentChapter?: number | null
  characterId?: number | null
  dreamId?: number | null
  botId?: number | null
  artCollectionId?: number | null
}

// Creates a fresh ACTIVE run owned by the user. A seed is generated when the
// caller doesn't supply one so runs are always reproducible/identifiable.
export async function createLifeRun(userId: number, input: CreateLifeRunInput) {
  const title = input.title?.trim()
  if (!title) throw withStatusCode('A run title is required.', 400)

  const seed = input.seed?.trim() || `run-${Date.now()}-${crypto.randomUUID()}`
  const currentChapter =
    typeof input.currentChapter === 'number' && input.currentChapter > 0
      ? input.currentChapter
      : 1

  return prisma.lifeRun.create({
    data: {
      userId,
      title,
      seed,
      status: 'ACTIVE',
      currentChapter,
      protagonistName: input.protagonistName ?? null,
      genre: input.genre ?? null,
      characterId: input.characterId ?? null,
      dreamId: input.dreamId ?? null,
      botId: input.botId ?? null,
      artCollectionId: input.artCollectionId ?? null,
    },
  })
}

export interface RecordChoiceInput {
  chapter: number
  prompt: string
  choiceText: string
  resultText?: string | null
  // Dimension (or arbitrary stat) key -> integer delta. Applied atomically to
  // LifeStat. The resolver only reads the 10 DAVINCI_DIMENSIONS, but any stat
  // key is allowed so the substrate stays flexible.
  effects?: Record<string, number>
  chatId?: number | null
}

// Records a LifeChoice and applies its stat deltas in one transaction. Only
// ACTIVE runs accept choices — a resolved (COMPLETE) or abandoned run is
// closed. Returns the created choice plus the run's full post-choice stats.
export async function recordLifeChoice(
  lifeRunId: number,
  userId: number,
  input: RecordChoiceInput,
) {
  if (!Number.isInteger(input.chapter) || input.chapter <= 0) {
    throw withStatusCode('chapter must be a positive integer.', 400)
  }
  const prompt = input.prompt?.trim()
  const choiceText = input.choiceText?.trim()
  if (!prompt || !choiceText) {
    throw withStatusCode('prompt and choiceText are required.', 400)
  }

  const effects = input.effects ?? {}
  for (const [key, delta] of Object.entries(effects)) {
    if (typeof delta !== 'number' || !Number.isFinite(delta)) {
      throw withStatusCode(`effect "${key}" must be a finite number.`, 400)
    }
  }

  return prisma.$transaction(async (tx) => {
    const run = await tx.lifeRun.findUnique({ where: { id: lifeRunId } })
    if (!run) throw withStatusCode(`LifeRun ${lifeRunId} does not exist.`, 404)
    if (run.userId !== userId) {
      throw withStatusCode(
        'LifeRun does not belong to the authenticated user.',
        403,
      )
    }
    if (run.status !== 'ACTIVE') {
      throw withStatusCode(
        `LifeRun ${lifeRunId} is ${run.status}; only ACTIVE runs accept choices.`,
        409,
      )
    }

    const choice = await tx.lifeChoice.create({
      data: {
        lifeRunId,
        chapter: input.chapter,
        prompt,
        choiceText,
        resultText: input.resultText ?? null,
        effects: effects as Prisma.InputJsonValue,
        chatId: input.chatId ?? null,
      },
    })

    for (const [key, delta] of Object.entries(effects)) {
      await tx.lifeStat.upsert({
        where: { lifeRunId_key: { lifeRunId, key } },
        create: { lifeRunId, key, value: delta },
        update: { value: { increment: delta } },
      })
    }

    // Advance the run's chapter marker so a resume reflects progress.
    if (input.chapter > run.currentChapter) {
      await tx.lifeRun.update({
        where: { id: lifeRunId },
        data: { currentChapter: input.chapter },
      })
    }

    const stats = await tx.lifeStat.findMany({
      where: { lifeRunId },
      orderBy: { key: 'asc' },
    })

    return { choice, stats }
  })
}

// Loads a run with its stats, choices, and (if resolved) ending — for resume.
export async function getLifeRunForUser(lifeRunId: number, userId: number) {
  const run = await prisma.lifeRun.findUnique({
    where: { id: lifeRunId },
    include: {
      Stats: { orderBy: { key: 'asc' } },
      Choices: { orderBy: [{ chapter: 'asc' }, { id: 'asc' }] },
      Ending: true,
    },
  })
  if (!run) throw withStatusCode(`LifeRun ${lifeRunId} does not exist.`, 404)
  if (run.userId !== userId) {
    throw withStatusCode(
      'LifeRun does not belong to the authenticated user.',
      403,
    )
  }
  return run
}
