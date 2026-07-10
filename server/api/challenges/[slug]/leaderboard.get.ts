// /server/api/challenges/[slug]/leaderboard.get.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { buildChallengeLeaderboard } from '~/server/utils/challengeCenter'

export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, 'slug')?.trim()

    if (!slug) {
      throw createError({ statusCode: 400, message: 'Challenge slug is required.' })
    }

    const challenge = await prisma.challenge.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        challengeType: true,
        status: true,
        Submissions: {
          where: { status: 'READY', contenderId: { not: null } },
          select: {
            id: true,
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
        },
      },
    })

    if (!challenge) {
      throw createError({ statusCode: 404, message: 'Challenge not found.' })
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Challenge leaderboard fetched successfully.',
      data: {
        challenge: {
          id: challenge.id,
          slug: challenge.slug,
          title: challenge.title,
          challengeType: challenge.challengeType,
          status: challenge.status,
        },
        leaderboard: buildChallengeLeaderboard(challenge.Submissions),
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
