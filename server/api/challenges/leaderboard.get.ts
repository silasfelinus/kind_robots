// /server/api/challenges/leaderboard.get.ts
import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { buildChallengeLeaderboard } from '~/server/utils/challengeCenter'

const challengeTypes = new Set([
  'ART',
  'TEXT',
  'CHARACTER',
  'SCENARIO',
  'REASONING',
])

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const challengeType =
      query.type === undefined || query.type === null || query.type === ''
        ? undefined
        : String(query.type).trim().toUpperCase()

    if (challengeType && !challengeTypes.has(challengeType)) {
      throw createError({ statusCode: 400, message: 'Invalid challenge type.' })
    }

    const submissions = await prisma.challengeSubmission.findMany({
      where: {
        status: 'READY',
        contenderId: { not: null },
        Challenge: challengeType
          ? { challengeType: challengeType as never }
          : undefined,
      },
      select: {
        id: true,
        challengeId: true,
        contenderId: true,
        variantKey: true,
        Contender: {
          select: {
            id: true,
            slug: true,
            name: true,
            avatarImageId: true,
          },
        },
        Reactions: {
          select: { reactionType: true },
        },
      },
    })

    const leaderboard = buildChallengeLeaderboard(submissions)
    const challengeIdsByContender = new Map<number, Set<number>>()

    for (const submission of submissions) {
      if (!submission.contenderId) continue

      const ids = challengeIdsByContender.get(submission.contenderId) ?? new Set()
      ids.add(submission.challengeId)
      challengeIdsByContender.set(submission.contenderId, ids)
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Global challenge leaderboard fetched successfully.',
      data: leaderboard.map((entry) => ({
        ...entry,
        challengesAttempted:
          challengeIdsByContender.get(entry.contenderId)?.size ?? 0,
      })),
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode

    return { ...handled, statusCode }
  }
})
