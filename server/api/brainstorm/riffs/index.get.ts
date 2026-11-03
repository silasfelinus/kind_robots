import { defineEventHandler, setResponseStatus } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { getOptionalAuthUser } from '~/server/utils/serverApi'
import { listRiffs } from '~/server/utils/brainstorm/riffBoard'

export default defineEventHandler(async (event) => {
  try {
    const viewer = await getOptionalAuthUser(event)
    const riffs = await listRiffs(viewer)
    return {
      success: true,
      message: `Found ${riffs.length} riffs.`,
      data: { riffs },
    }
  } catch (error) {
    const handled = errorHandler(error)
    setResponseStatus(event, handled.statusCode || 500)
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Could not load the riff board.',
      data: { riffs: [] },
    }
  }
})
