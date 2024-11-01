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
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid Bot ID. It must be a positive integer.',
      })
    }

    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
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
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Fetch the bot and verify ownership
    const bot = await fetchBotById(botId)
    if (!bot) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Bot with ID ${botId} does not exist.`,
      })
    }

    if (bot.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this bot.',
      })
    }

    // Attempt to delete the bot
    const deleted = await deleteBot(botId)
    if (!deleted) {
      event.node.res.statusCode = 500
      throw createError({
        statusCode: 500,
        message: `Failed to delete bot with ID ${botId}.`,
      })
    }

    // Successful deletion response
    response = {
      success: true,
      message: `Bot with ID ${botId} successfully deleted.`,
      statusCode: 200,
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
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
