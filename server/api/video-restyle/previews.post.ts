import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import {
  listRestylePreviews,
  queueRestylePreviews,
} from '@/server/utils/videoRestylePreviews'
import { isRestyleStyle } from '@/utils/videoRestylePlan'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body =
      (await readBody<{
        styleIds?: unknown
        missing?: unknown
        force?: unknown
      }>(event)) ?? {}
    const requested = Array.isArray(body.styleIds) ? body.styleIds : []
    if (!requested.every(isRestyleStyle)) {
      throw createError({
        statusCode: 400,
        message: 'Unknown animation style.',
      })
    }
    const styleIds =
      body.missing === true
        ? (await listRestylePreviews())
            .filter((preview) => !preview.imageUrl)
            .map((preview) => preview.styleId)
        : requested
    if (!styleIds.length && body.missing !== true) {
      throw createError({ statusCode: 400, message: 'Choose a style preview.' })
    }
    const outcomes = await queueRestylePreviews(
      event,
      styleIds,
      body.force === true,
    )
    return {
      success: true,
      statusCode: 200,
      message: `${outcomes.filter((outcome) => outcome.status === 'queued' || outcome.status === 'requeued').length} style preview(s) queued.`,
      data: { outcomes, previews: await listRestylePreviews() },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
