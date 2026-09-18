// /server/api/challenges/[slug]/leaderboard.get.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { buildChallengeLeaderboard } from '~/server/utils/challengeCenter'
import { getOptionalApiUser } from '@/server/utils/authGuard'
import { viewerShowsMature } from '@/server/utils/contentAccess'

export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, 'slug')?.trim()

    if (!slug) {
      throw createError({
        statusCode: 400,
        message: 'Challenge slug is required.',
      })
    }

    /*
     * Challenge carries isMature but no isPublic, so maturity is the whole
     * rule here -- and it was not applied: a maturity-restricted account could
     * read a mature challenge's title and its contenders' names straight off
     * the leaderboard. Silas, 2026-09-17: "a mature object should not even look
     * like it exists for children accounts, so that things like text should not
     * be viewable either." A restricted viewer gets the same 404 as a slug that
     * does not exist.
     */
    const auth = await getOptionalApiUser(event)
    const restricted = !viewerShowsMature(auth?.user)

    const challenge = await prisma.challenge.findFirst({
      where: {
        slug,
        ...(restricted ? { isMature: false } : {}),
      },
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
            promptUsed: true,
            randomSelections: true,
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
