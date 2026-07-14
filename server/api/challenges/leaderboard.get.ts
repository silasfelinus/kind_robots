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
    const winsByContender = new Map<number, number>()
    const submissionsByChallenge = new Map<number, typeof submissions>()

    for (const submission of submissions) {
      if (!submission.contenderId) continue

      const ids = challengeIdsByContender.get(submission.contenderId) ?? new Set()
      ids.add(submission.challengeId)
      challengeIdsByContender.set(submission.contenderId, ids)

      const challengeSubmissions = submissionsByChallenge.get(submission.challengeId) ?? []
      challengeSubmissions.push(submission)
      submissionsByChallenge.set(submission.challengeId, challengeSubmissions)
    }

    for (const challengeSubmissions of submissionsByChallenge.values()) {
      const challengeLeaders = buildChallengeLeaderboard(challengeSubmissions)
      const winningScore = challengeLeaders[0]?.score.netScore
      if (winningScore === undefined) continue

      for (const leader of challengeLeaders) {
        if (leader.score.netScore !== winningScore) break
        winsByContender.set(
          leader.contenderId,
          (winsByContender.get(leader.contenderId) ?? 0) + 1,
        )
      }
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Global challenge leaderboard fetched successfully.',
      data: leaderboard.map((entry) => {
        const challengesAttempted =
          challengeIdsByContender.get(entry.contenderId)?.size ?? 0
        const challengesWon = winsByContender.get(entry.contenderId) ?? 0

        return {
          ...entry,
          challengesAttempted,
          challengesWon,
          winRate:
            challengesAttempted > 0
              ? Math.round((challengesWon / challengesAttempted) * 1000) / 10
              : 0,
        }
      }),
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode

    return { ...handled, statusCode }
  }
})
