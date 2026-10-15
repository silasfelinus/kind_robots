import { defineEventHandler, getRouterParam } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { loadRestyleJob } from '@/server/utils/videoRestyleJobs'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const job = await loadRestyleJob(auth.user.id, getRouterParam(event, 'id') || '')
    return { success: true, statusCode: 200, message: 'Restyle project loaded.', data: job }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
