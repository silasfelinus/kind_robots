import { defineEventHandler, getRouterParam } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { loadRestyleJob } from '@/server/utils/videoRestyleJobs'
import { retryFailedRestyleFullArtJob } from '@/server/utils/videoRestyleArtJob'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const project = await loadRestyleJob(
      auth.user.id,
      getRouterParam(event, 'id') || '',
    )
    if (
      !project.full?.artJobId ||
      !['FULL_FAILED', 'FULL_RUNNING', 'FULL_QUEUED'].includes(project.status)
    ) {
      throw new Error('Only failed full films can be retried.')
    }
    const job = await retryFailedRestyleFullArtJob(project.full.artJobId)
    return {
      success: true,
      statusCode: 200,
      message: 'Full-length render requeued with saved windows.',
      data: job,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
