import { createError, defineEventHandler, getQuery } from 'h3'
import { errorHandler } from '@/server/utils/error'
import { summarizeMissionMetrics } from '@/server/utils/missionMetrics'

const DEFAULT_DAYS = 30
const MAX_DAYS = 90

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const rawDays = Array.isArray(query.days) ? query.days[0] : query.days
    const days = rawDays == null || rawDays === '' ? DEFAULT_DAYS : Number(rawDays)

    if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
      throw createError({
        statusCode: 400,
        message: `days must be an integer from 1 to ${MAX_DAYS}.`,
      })
    }

    const summary = await summarizeMissionMetrics(days)

    return {
      success: true,
      data: summary,
      message:
        'Aggregate Rainbow Butterflies mission metrics. These counts do not include donor identities or donation amounts.',
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      data: null,
      message: handled.message,
      statusCode: event.node.res.statusCode,
    }
  }
})
