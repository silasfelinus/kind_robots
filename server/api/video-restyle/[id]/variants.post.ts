import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { cloneRestyleVideo } from '@/server/utils/videoRestyleJobs'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const body =
      (await readBody<{
        title?: unknown
        style?: unknown
        quality?: unknown
        isPrivate?: unknown
        isMature?: unknown
        variantStyleIds?: unknown
        variantMode?: unknown
        overwriteStrength?: unknown
        renderSpeed?: unknown
      }>(event)) ?? {}
    const cloned = await cloneRestyleVideo({
      userId: auth.user.id,
      id: getRouterParam(event, 'id') || '',
      title: body.title,
      style: body.style,
      quality: body.quality,
      variantStyleIds: body.variantStyleIds,
      variantMode: body.variantMode,
      renderSpeed: body.renderSpeed,
      overwriteStrength: body.overwriteStrength,
      isPrivate: body.isPrivate,
      isMature: body.isMature,
    })
    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      message:
        'Independent style project created from your private saved source.',
      data: cloned,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
