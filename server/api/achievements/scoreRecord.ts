import { createError } from 'h3'
import prisma from '../../utils/prisma'
import type { Prisma } from '~/prisma/generated/prisma/client'

export type AchievementScoreField = 'clickRecord' | 'matchRecord'

export type AchievementScoreResult = {
  userId: number
  newScore: number
  previousScore: number
  improved: boolean
}

export function parseAchievementScoreBody(body: unknown): number {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: 'Score update payload is required.',
    })
  }

  const record = body as Record<string, unknown>
  const unsupportedFields = Object.keys(record).filter(
    (field) => field !== 'newScore',
  )

  if (unsupportedFields.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported score update fields: ${unsupportedFields.join(', ')}. User identity comes from authentication.`,
    })
  }

  if (!Number.isSafeInteger(record.newScore) || Number(record.newScore) < 0) {
    throw createError({
      statusCode: 400,
      message: '"newScore" must be a non-negative safe integer.',
    })
  }

  return Number(record.newScore)
}

export async function updateAchievementHighScore(options: {
  userId: number
  field: AchievementScoreField
  newScore: number
}): Promise<AchievementScoreResult> {
  const user = await prisma.user.findUnique({
    where: { id: options.userId },
    select: {
      id: true,
      clickRecord: true,
      matchRecord: true,
    },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'Authenticated user not found.',
    })
  }

  const previousScore = user[options.field] ?? 0
  const newScore = Math.max(previousScore, options.newScore)
  const improved = newScore > previousScore

  if (improved) {
    const data: Prisma.UserUpdateInput =
      options.field === 'clickRecord'
        ? { clickRecord: newScore }
        : { matchRecord: newScore }

    await prisma.user.update({
      where: { id: options.userId },
      data,
      select: { id: true },
    })
  }

  return {
    userId: options.userId,
    newScore,
    previousScore,
    improved,
  }
}
