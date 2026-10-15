import { defineEventHandler, getRouterParam } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { queueRestylePilot } from '@/server/utils/videoRestyleJobs'
import { syncRestylePilotArtJob } from '@/server/utils/videoRestyleArtJob'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const queued = await queueRestylePilot(
      auth.user.id,
      getRouterParam(event, 'id') || '',
    )
    const job = await syncRestylePilotArtJob(queued)
    return {
      success: true,
      statusCode: 200,
      message: 'Pilot registered in ArtJob for the local GPU worker.',
      data: job,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
