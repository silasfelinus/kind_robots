//server/api/bots/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import type { Prisma } from '@prisma/client'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  let response
  let botId

  try {
    // Validate bot ID
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
    const existingBot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { userId: true },
    })
    if (!existingBot) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Bot with ID ${botId} does not exist.`,
      })
    }

    if (existingBot.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this bot.',
      })
    }

    // Parse and validate update data
    const botData = await readBody(event)
    if (!botData || Object.keys(botData).length === 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the bot in the database
    const updatedBot = await prisma.bot.update({
      where: { id: botId },
      data: botData as Prisma.BotUpdateInput,
    })

    // Successful update response
    response = {
      success: true,
      bot: updatedBot,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error updating bot:', handledError)

    // Set the response and status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to update bot with ID ${botId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
