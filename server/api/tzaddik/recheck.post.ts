// /server/api/tzaddik/recheck.post.ts
//
// "Request recheck" control (tzaddik-gallery/t-005): lets a signed-in user ask
// for a candidate's sourced facts to be re-verified against Wikipedia. Writes a
// TzaddikRecheckRequest row; nothing in this repo runs the actual re-fetch yet
// (status stays PENDING until that lands), but the request itself, its
// dedupe, and the last-checked/pending UI state are real today.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

type RecheckBody = { candidateId?: unknown }

function toPositiveId(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<RecheckBody>(event)
    const candidateId = toPositiveId(body?.candidateId)

    if (!candidateId) {
      throw createError({
        statusCode: 400,
        message: '"candidateId" is required.',
      })
    }

    const candidate = await prisma.tzaddikCandidate.findUnique({
      where: { id: candidateId },
      select: { id: true, curationState: true, submittedByUserId: true },
    })

    if (!candidate) {
      throw createError({
        statusCode: 404,
        message: 'Tzaddik candidate not found.',
      })
    }

    // Same visibility as the detail route: a candidate not yet public is
    // rechecked only by whoever submitted it (or an admin).
    if (
      candidate.curationState !== 'APPROVED' &&
      candidate.submittedByUserId !== user.id
    ) {
      throw createError({
        statusCode: 404,
        message: 'Tzaddik candidate not found.',
      })
    }

    // Dedupe: one in-flight recheck per candidate at a time, same shape as the
    // Resource preview-job dedupe (server/api/resources/[id]/generate-preview.post.ts)
    // -- return the existing request rather than queuing a second one.
    const existing = await prisma.tzaddikRecheckRequest.findFirst({
      where: { candidateId, status: { in: ['PENDING', 'CHECKING'] } },
      orderBy: { createdAt: 'desc' },
    })

    const data =
      existing ??
      (await prisma.tzaddikRecheckRequest.create({
        data: {
          candidateId,
          requestedByUserId: user.id,
          status: 'PENDING',
        },
      }))

    event.node.res.statusCode = existing ? 200 : 201

    return {
      success: true,
      message: existing
        ? 'A recheck for this candidate is already pending.'
        : 'Recheck requested.',
      data,
      statusCode: event.node.res.statusCode,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to request a recheck.',
      data: null,
      statusCode: statusCode || 500,
    }
  }
})
