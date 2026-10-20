import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { renameRestyleProject } from '@/server/utils/videoRestyleJobs'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const body = (await readBody<{ title?: unknown }>(event)) ?? {}
    const job = await renameRestyleProject(
      auth.user.id,
      getRouterParam(event, 'id') || '',
      body.title,
    )
    return {
      success: true,
      statusCode: 200,
      message: 'Project renamed.',
      data: job,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
