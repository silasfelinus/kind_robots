// /server/api/channels/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchChannel } from '../utils/fetchChannel'
import { fetchMessagesByChannelId } from '../utils/fetchMessages'

export default defineEventHandler(async (event) => {
  let response

  try {
    // Validate Channel ID
    const channelId = Number(event.context.params?.id)
    if (isNaN(channelId) || channelId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Channel ID. It must be a positive integer.',
      })
    }

    // Fetch the channel
    const channel = await fetchChannel(channelId)
    if (!channel) {
      throw createError({
        statusCode: 404,
        message: 'Channel not found.',
      })
    }

    // Fetch messages for the channel
    const messages = await fetchMessagesByChannelId(channelId)

    response = {
      success: true,
      data: {
        channel,
        messages,
      },
      message: 'Channel and messages retrieved successfully.',
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to retrieve channel data.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
