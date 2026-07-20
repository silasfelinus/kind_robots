// /server/api/challenges/submissions/[id].delete.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { userIsAdmin } from '~/server/utils/authUser'
import { challengeSubmissionMutationSelect } from '~/server/utils/challengeSubmissionResource'
import { validateApiKey } from '~/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    const auth = await validateApiKey(event)

    if (!auth.isValid || !auth.user) {
      throw createError({ statusCode: 401, message: 'Authentication required.' })
    }

    if (!userIsAdmin(auth.user)) {
      throw createError({ statusCode: 403, message: 'Admin access required.' })
    }

    const submissionId = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'ChallengeSubmission ID must be a positive integer.',
      })
    }

    const existing = await prisma.challengeSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true },
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'ChallengeSubmission not found.',
      })
    }

    const submission = await prisma.challengeSubmission.delete({
      where: { id: existing.id },
      select: challengeSubmissionMutationSelect,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'ChallengeSubmission deleted successfully.',
      data: submission,
      statusCode: 200,
    }
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      event.node.res.statusCode = 409
      return {
        success: false,
        message: 'ChallengeSubmissions with reactions cannot be deleted.',
        statusCode: 409,
      }
    }

    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode

    return { ...handled, statusCode }
  }
})
