import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { loadRestyleJob } from '@/server/utils/videoRestyleJobs'
import { retryFailedRestyleArtJob } from '@/server/utils/videoRestyleArtJob'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const job = await loadRestyleJob(
      auth.user.id,
      getRouterParam(event, 'id') || '',
    )
    if (!job.pilot?.artJobId) {
      throw createError({
        statusCode: 409,
        message: 'Pilot has no linked ArtJob.',
      })
    }
    const queued = await retryFailedRestyleArtJob(job.pilot.artJobId)
    return {
      success: true,
      statusCode: 200,
      message: `ArtJob #${job.pilot.artJobId} requeued for KR Relay.`,
      data: queued,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
