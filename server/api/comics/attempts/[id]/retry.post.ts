import { createError, defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { attemptDtosForSlots, readComicId } from '@/server/utils/comicStudio'

type RequeueResponse = { success?: boolean; message?: string }

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = readComicId(event, 'attempt id')
    const attempt = await prisma.comicAttempt.findUnique({ where: { id } })
    if (!attempt)
      throw createError({ statusCode: 404, message: 'Attempt not found.' })
    if (!attempt.artJobId) {
      throw createError({
        statusCode: 409,
        message:
          'This attempt never reached the queue. Render the lane again instead.',
      })
    }
    if (attempt.status !== 'FAILED' && attempt.status !== 'CANCELLED') {
      throw createError({
        statusCode: 409,
        message: 'Only a failed render can be retried.',
      })
    }
    const response = await event.$fetch<RequeueResponse, string>(
      `/api/art/queue/${attempt.artJobId}/requeue`,
      { method: 'POST', body: {} },
    )
    if (!response?.success) {
      throw createError({
        statusCode: 502,
        message: response?.message || 'Requeue failed.',
      })
    }
    await prisma.comicAttempt.update({
      where: { id },
      data: { status: 'PENDING', error: null },
    })
    return {
      success: true,
      statusCode: 200,
      message: `ArtJob ${attempt.artJobId} requeued.`,
      data: { attempts: await attemptDtosForSlots([attempt.slotId]) },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
