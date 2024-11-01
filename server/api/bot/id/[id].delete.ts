// server/api/bots/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { deleteBot, fetchBotById } from '../../bots'
import { errorHandler } from '../../utils/error' // Centralized error handler
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Validate bot ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid bot ID. It must be a positive integer.',
      })
    }

    // Extract and validate the API key from the Authorization header
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401, // Unauthorized
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      throw createError({
        statusCode: 401, // Unauthorized
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Fetch the bot to check if the user is the owner
    const bot = await fetchBotById(id)
    if (!bot) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Bot with ID ${id} does not exist.`,
      })
    }

    // Verify ownership of the bot
    if (bot.userId !== userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You do not have permission to delete this bot.',
      })
    }

    // Attempt to delete the bot
    const deleted = await deleteBot(id)
    if (!deleted) {
      throw createError({
        statusCode: 500, // Internal Server Error
        message: `Failed to delete bot with ID ${id}.`,
      })
    }

    return {
      success: true,
      message: `Bot with ID ${id} successfully deleted.`,
      statusCode: 200, // Explicitly set success statusCode for Cypress testing
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message: handledError.message || `Failed to delete bot with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
