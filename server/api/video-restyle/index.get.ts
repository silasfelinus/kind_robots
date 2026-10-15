import { defineEventHandler } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { listRestyleJobs } from '@/server/utils/videoRestyleJobs'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const jobs = await listRestyleJobs(auth.user.id)
    return { success: true, statusCode: 200, message: 'Private restyle projects loaded.', data: jobs }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
