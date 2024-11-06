// /server/api/chats/bot/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  let response

  try {
    const botId = Number(event.context.params?.id)
    if (isNaN(botId) || botId <= 0) {
      throw new Error('Invalid Bot ID.')
    }

    // Fetch chats associated with the bot ID
    const botChats = await prisma.chatExchange.findMany({ where: { botId } })

    response = {
      success: true,
      data: {
        botChats,
      },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to retrieve bot chats.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
