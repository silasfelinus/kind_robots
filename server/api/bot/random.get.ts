// server/api/bots/random.get.ts
import { defineEventHandler } from 'h3'
import { randomBot } from '../bots'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const bot = await randomBot()

    if (!bot) {
      event.node.res.statusCode = 404 // Not Found
      return { success: false, message: 'No bots available.' }
    }

    // Wrap bot in a data object for consistent response format
    return { success: true, data: { bot } }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to fetch a random bot.',
    }
  }
})
