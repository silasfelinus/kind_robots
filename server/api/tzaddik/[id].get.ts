// /server/api/tzaddik/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { getOptionalApiUser } from '../../utils/authGuard'

export default defineEventHandler(async (event) => {
  const candidateId = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(candidateId) || candidateId <= 0) {
      event.node.res.statusCode = 400
      return {
        success: false,
        message: 'Invalid ID format. ID must be a positive integer.',
        data: null,
        statusCode: 400,
      }
    }

    const auth = await getOptionalApiUser(event)
    const isAdmin = auth?.isAdmin ?? false
    const viewerId = auth?.user.id ?? null

    const candidate = await prisma.tzaddikCandidate.findUnique({
      where: { id: candidateId },
      include: {
        Tags: true,
        RecheckRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!candidate) {
      event.node.res.statusCode = 404
      return {
        success: false,
        message: 'Tzaddik candidate not found.',
        data: null,
        statusCode: 404,
      }
    }

    // Same visibility rule as the public gallery list (index.get.ts) plus a
    // carve-out for the submitter and admins, so a submission is visible to
    // the person who submitted it while it is still PENDING review.
    const visible =
      isAdmin ||
      candidate.curationState === 'APPROVED' ||
      (viewerId !== null && candidate.submittedByUserId === viewerId)

    if (!visible) {
      event.node.res.statusCode = 404
      return {
        success: false,
        message: 'Tzaddik candidate not found.',
        data: null,
        statusCode: 404,
      }
    }

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Tzaddik candidate retrieved successfully.',
      data: candidate,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    const statusCode = handledError.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handledError.message || 'Failed to retrieve Tzaddik candidate.',
      data: null,
      statusCode,
    }
  }
})
