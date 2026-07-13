// /server/api/challenges/submissions/[id]/reaction.post.ts
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { validateApiKey } from '~/server/utils/validateKey'

const allowedReactionTypes = ['LOVED', 'CLAPPED', 'BOOED', 'HATED'] as const

type ChallengeReactionType = (typeof allowedReactionTypes)[number]

type ReactionBody = {
  reactionType?: unknown
}

function parseReactionType(value: unknown): ChallengeReactionType {
  if (
    typeof value !== 'string' ||
    !allowedReactionTypes.includes(value as ChallengeReactionType)
  ) {
    throw createError({
      statusCode: 400,
      message: `reactionType must be one of: ${allowedReactionTypes.join(', ')}.`,
    })
  }

  return value as ChallengeReactionType
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await validateApiKey(event)

    if (!auth.isValid || !auth.user) {
      throw createError({ statusCode: 401, message: 'Login is required to vote.' })
    }

    const submissionId = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'A valid challenge submission ID is required.',
      })
    }

    const body = await readBody<ReactionBody>(event)
    const reactionType = parseReactionType(body?.reactionType)

    const submission = await prisma.challengeSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        status: true,
        Challenge: {
          select: { status: true },
        },
      },
    })

    if (!submission) {
      throw createError({ statusCode: 404, message: 'Submission not found.' })
    }

    if (submission.status !== 'READY') {
      throw createError({
        statusCode: 409,
        message: 'Only ready submissions can receive votes.',
      })
    }

    if (submission.Challenge.status === 'CLOSED') {
      throw createError({
        statusCode: 409,
        message: 'Voting is closed for this challenge.',
      })
    }

    const reaction = await prisma.reaction.upsert({
      where: {
        userId_challengeSubmissionId: {
          userId: auth.user.id,
          challengeSubmissionId: submissionId,
        },
      },
      create: {
        User: { connect: { id: auth.user.id } },
        ChallengeSubmission: { connect: { id: submissionId } },
        reactionType,
        reactionCategory: 'CHALLENGE_SUBMISSION',
        rating: 0,
      },
      update: {
        reactionType,
        reactionCategory: 'CHALLENGE_SUBMISSION',
        rating: 0,
      },
      select: {
        id: true,
        reactionType: true,
        challengeSubmissionId: true,
        updatedAt: true,
      },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Vote recorded.',
      data: reaction,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode

    return { ...handled, statusCode }
  }
})
