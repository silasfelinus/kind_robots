import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { updateRestyleSettings } from '@/server/utils/videoRestyleJobs'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const body =
      (await readBody<{ style?: unknown; quality?: unknown; isPrivate?: unknown; isMature?: unknown }>(event)) ?? {}
    const job = await updateRestyleSettings(
      auth.user.id,
      getRouterParam(event, 'id') || '',
      body.style,
      body.quality,
      body.isPrivate,
      body.isMature,
    )
    return {
      success: true,
      statusCode: 200,
      message: 'Restyle settings saved.',
      data: job,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
