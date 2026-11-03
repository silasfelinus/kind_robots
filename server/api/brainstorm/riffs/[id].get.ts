import { defineEventHandler, getRouterParam, setResponseStatus } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { getOptionalAuthUser } from '~/server/utils/serverApi'
import {
  loadRiffDetail,
  parsePositiveId,
} from '~/server/utils/brainstorm/riffBoard'

export default defineEventHandler(async (event) => {
  try {
    const riffId = parsePositiveId(getRouterParam(event, 'id'), 'riff id')
    const viewer = await getOptionalAuthUser(event)
    const detail = await loadRiffDetail(riffId, viewer)
    return {
      success: true,
      message: `Loaded ${detail.lines.length} lines.`,
      data: detail,
    }
  } catch (error) {
    const handled = errorHandler(error)
    setResponseStatus(event, handled.statusCode || 500)
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Could not load that riff.',
    }
  }
})
