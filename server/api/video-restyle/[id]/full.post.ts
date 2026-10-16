import { defineEventHandler, getRouterParam } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { queueRestyleFull } from '@/server/utils/videoRestyleJobs'
import { syncRestyleFullArtJob } from '@/server/utils/videoRestyleArtJob'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const queued = await queueRestyleFull(
      auth.user.id,
      getRouterParam(event, 'id') || '',
    )
    const job = await syncRestyleFullArtJob(queued)
    return {
      success: true,
      statusCode: 200,
      message: 'Full-length film queued privately in ArtJob.',
      data: job,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
