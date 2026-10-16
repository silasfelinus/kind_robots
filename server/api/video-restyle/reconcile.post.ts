import { defineEventHandler } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { listRestyleJobs } from '@/server/utils/videoRestyleJobs'
import { syncRestyleFullArtJob, syncRestylePilotArtJob } from '@/server/utils/videoRestyleArtJob'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const jobs = await listRestyleJobs(auth.user.id)
    const synchronized = []
    for (const job of jobs) {
      synchronized.push(
        job.full ? await syncRestyleFullArtJob(job) : await syncRestylePilotArtJob(job),
      )
    }
    return {
      success: true,
      statusCode: 200,
      message: 'Restyle pilots synchronized with ArtJob.',
      data: synchronized,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
