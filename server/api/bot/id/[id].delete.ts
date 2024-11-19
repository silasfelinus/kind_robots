// server/api/bots/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { deleteBot, fetchBotById } from '../../bots'

export default defineEventHandler(async (event) => {
  let response
  let botId

  try {
    // Validate the Bot ID
    botId = Number(event.context.params?.id)
    if (isNaN(botId) || botId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Bot ID. It must be a positive integer.',
      })
    }

    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
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
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Fetch the bot and verify ownership
    const botResponse = await fetchBotById(botId)
    const bot = botResponse?.data?.bot // Safely access bot

    if (!bot) {
      throw createError({
        statusCode: 404,
        message: `Bot with ID ${botId} does not exist.`,
      })
    }

// Check if user is an admin
    if (user.Role === 'ADMIN') {
      // Admin bypass: Delete the bot entry directly
      await prisma.bot.delete({ where: { id: botId } })
      return {
        success: true,
        message: `Bot entry with ID ${botId} deleted successfully by admin.`,
      }
    }

    if (bot.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this bot.',
      })
    }

    // Attempt to delete the bot
    const deleted = await deleteBot(botId)
    if (!deleted) {
      throw createError({
        statusCode: 500,
        message: `Failed to delete bot with ID ${botId}.`,
      })
    }

    // Successful deletion response
    response = {
      success: true,
      data: { message: `Bot with ID ${botId} successfully deleted.` },
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error deleting bot:', handledError)

    // Set the response and status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to delete bot with ID ${botId}.`,
    }
  }

  return response
})
