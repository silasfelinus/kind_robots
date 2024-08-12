// server/api/channels/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchChannel } from '../utils/fetchChannel'
import { fetchMessagesByChannelId } from '../utils/fetchMessages'

export default defineEventHandler(async (event) => {
  try {
    const channelId = Number(event.context.params?.id)
    if (!channelId) {
      throw new Error('Invalid Channel ID.')
    }

    // Fetch the channel
    const channel = await fetchChannel(channelId)
    if (!channel) {
      throw new Error('Channel not found.')
    }

    // Fetch messages for the channel
    const messages = await fetchMessagesByChannelId(channelId)

    return {
      success: true,
      channel,
      messages,
    }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    return {
      success,
      message,
      statusCode,
    }
  }
})
