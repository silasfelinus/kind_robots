import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '@/server/utils/error'
import {
  assertMissionEventRateLimit,
  recordMissionEvent,
} from '@/server/utils/missionMetrics'
import { normalizeMissionEventInput } from '@/utils/missionMetricsContract'

const ALLOWED_FIELDS = new Set(['event', 'source', 'campaign', 'placement'])

export default defineEventHandler(async (event) => {
  try {
    assertMissionEventRateLimit(event)

    const body = await readBody<unknown>(event)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'Mission event body must be a JSON object.',
      })
    }

    const unknownField = Object.keys(body as Record<string, unknown>).find(
      (key) => !ALLOWED_FIELDS.has(key),
    )
    if (unknownField) {
      throw createError({
        statusCode: 400,
        message: `Unsupported mission event field: ${unknownField}.`,
      })
    }

    const input = normalizeMissionEventInput(body)
    if (!input) {
      throw createError({
        statusCode: 400,
        message:
          'Mission event must be one of visit, return_visit, or fundraiser_click.',
      })
    }

    await recordMissionEvent(input)

    event.node.res.statusCode = 202
    return {
      success: true,
      message: 'Mission event accepted.',
      statusCode: 202,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message,
      statusCode: event.node.res.statusCode,
    }
  }
})
