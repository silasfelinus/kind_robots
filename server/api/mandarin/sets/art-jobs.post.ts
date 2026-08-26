// /server/api/mandarin/sets/art-jobs.post.ts
//
// mandarin-tutor/t-016: upserts the queued-illustration ArtJob id for one of the
// learner's own cards into MandarinArtJobLink, so a returning learner (or a second
// device) can resume polling a job that was already enqueued instead of re-enqueueing.
// Rides the same /api/mandarin/sets endpoint family per the task's own note ("artJobs
// can ride the same migration and endpoints"). The ArtJob row itself remains the
// source of truth for job status -- this only remembers which job belongs to which
// card for which learner.
import { createError, defineEventHandler, readBody } from 'h3'
import { requireApiUser } from '../../../utils/authGuard'
import { errorHandler } from '../../../utils/error'
import { prisma } from '../../../utils/prisma'

const MAX_CARD_KEY_LENGTH = 255

type RequestBody = {
  cardKey?: unknown
  jobId?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = ((await readBody(event)) ?? {}) as RequestBody

    const cardKey = String(body.cardKey ?? '').trim()
    if (!cardKey || cardKey.length > MAX_CARD_KEY_LENGTH) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A valid cardKey is required.',
      })
    }

    const jobId = Number(body.jobId)
    if (!Number.isInteger(jobId) || jobId <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A valid jobId is required.',
      })
    }

    const userId = auth.user.id

    const link = await prisma.mandarinArtJobLink.upsert({
      where: { userId_cardKey: { userId, cardKey } },
      create: { userId, cardKey, jobId },
      update: { jobId },
    })

    return {
      success: true,
      statusCode: 200,
      message: 'Mandarin art job link saved.',
      data: { cardKey: link.cardKey, jobId: link.jobId },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to save the Mandarin art job link.',
    }
  }
})
