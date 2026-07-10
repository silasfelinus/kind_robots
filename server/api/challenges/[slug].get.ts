// /server/api/challenges/[slug].get.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import {
  buildChallengeLeaderboard,
  scoreChallengeReactions,
} from '~/server/utils/challengeCenter'

export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, 'slug')?.trim()

    if (!slug) {
      throw createError({ statusCode: 400, message: 'Challenge slug is required.' })
    }

    const challenge = await prisma.challenge.findUnique({
      where: { slug },
      include: {
        User: {
          select: { id: true, username: true },
        },
        Submissions: {
          where: { status: 'READY' },
          include: {
            Contender: {
              select: {
                id: true,
                slug: true,
                name: true,
                kind: true,
                provider: true,
                model: true,
                generator: true,
                avatarImageId: true,
                description: true,
              },
            },
            ArtImage: {
              select: {
                id: true,
                imagePath: true,
                thumbnailPath: true,
                fileName: true,
                promptString: true,
              },
            },
            Character: true,
            Scenario: true,
            Reactions: {
              select: { reactionType: true },
            },
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    })

    if (!challenge) {
      throw createError({ statusCode: 404, message: 'Challenge not found.' })
    }

    const leaderboard = buildChallengeLeaderboard(challenge.Submissions)
    const rankByContender = new Map(
      leaderboard.map((entry, index) => [entry.contenderId, index + 1]),
    )

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Challenge fetched successfully.',
      data: {
        ...challenge,
        Submissions: challenge.Submissions.map((submission) => ({
          ...submission,
          score: scoreChallengeReactions(submission.Reactions),
          rank: submission.contenderId
            ? rankByContender.get(submission.contenderId) ?? null
            : null,
        })),
        leaderboard,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode

    return { ...handled, statusCode }
  }
})
