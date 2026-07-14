// /server/api/challenges/leaderboard.get.ts
import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import {
  buildChallengeLeaderboard,
  buildFacetLeaderboard,
  type ContenderFacetKey,
} from '~/server/utils/challengeCenter'

const challengeTypes = new Set([
  'ART',
  'TEXT',
  'CHARACTER',
  'SCENARIO',
  'REASONING',
])

const facetKeys = new Set<ContenderFacetKey>([
  'kind',
  'provider',
  'model',
  'generator',
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

    const rawFacet =
      query.facet === undefined || query.facet === null || query.facet === ''
        ? 'contender'
        : String(query.facet).trim().toLowerCase()

    if (
      rawFacet !== 'contender' &&
      !facetKeys.has(rawFacet as ContenderFacetKey)
    ) {
      throw createError({
        statusCode: 400,
        message:
          'Invalid facet. Use contender, kind, provider, model, or generator.',
      })
    }

    const facet =
      rawFacet === 'contender' ? null : (rawFacet as ContenderFacetKey)

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
            kind: true,
            provider: true,
            model: true,
            generator: true,
          },
        },
        Reactions: {
          select: { reactionType: true },
        },
      },
    })

    const submissionsByChallenge = new Map<number, typeof submissions>()
    for (const submission of submissions) {
      const challengeSubmissions =
        submissionsByChallenge.get(submission.challengeId) ?? []
      challengeSubmissions.push(submission)
      submissionsByChallenge.set(submission.challengeId, challengeSubmissions)
    }

    event.node.res.statusCode = 200

    if (facet) {
      const leaderboard = buildFacetLeaderboard(submissions, facet)
      const challengeIdsByValue = new Map<string, Set<number>>()
      const winsByValue = new Map<string, number>()

      for (const submission of submissions) {
        const value = submission.Contender?.[facet]
        if (!value) continue

        const ids = challengeIdsByValue.get(value) ?? new Set()
        ids.add(submission.challengeId)
        challengeIdsByValue.set(value, ids)
      }

      for (const challengeSubmissions of submissionsByChallenge.values()) {
        const challengeLeaders = buildFacetLeaderboard(
          challengeSubmissions,
          facet,
        )
        const winningScore = challengeLeaders[0]?.score.netScore
        if (winningScore === undefined) continue

        for (const leader of challengeLeaders) {
          if (leader.score.netScore !== winningScore) break
          winsByValue.set(
            leader.value,
            (winsByValue.get(leader.value) ?? 0) + 1,
          )
        }
      }

      return {
        success: true,
        message: `Challenge leaderboard by ${facet} fetched successfully.`,
        facet,
        data: leaderboard.map((entry) => {
          const challengesAttempted =
            challengeIdsByValue.get(entry.value)?.size ?? 0
          const challengesWon = winsByValue.get(entry.value) ?? 0

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
    }

    const leaderboard = buildChallengeLeaderboard(submissions)
    const challengeIdsByContender = new Map<number, Set<number>>()
    const winsByContender = new Map<number, number>()

    for (const submission of submissions) {
      if (!submission.contenderId) continue

      const ids =
        challengeIdsByContender.get(submission.contenderId) ?? new Set()
      ids.add(submission.challengeId)
      challengeIdsByContender.set(submission.contenderId, ids)
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

    return {
      success: true,
      message: 'Global challenge leaderboard fetched successfully.',
      facet: 'contender',
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
