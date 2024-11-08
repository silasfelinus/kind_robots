// /server/api/chats/bot/[botId].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

export default defineEventHandler(async (event) => {
  const botId = Number(event.context.params?.botId)

  if (isNaN(botId) || botId <= 0) {
    return errorHandler({
      error: new Error('Invalid Bot ID. It must be a positive integer.'),
      context: 'Fetch Chats by Bot ID',
      statusCode: 400,
    })
  }

  try {
    // Authenticate the request
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      return errorHandler({
        error: new Error('Invalid or expired token.'),
        context: 'Fetch Chats by Bot ID',
        statusCode: 401,
      })
    }

    // Fetch chats involving the specified bot with access control
    const data = await prisma.chat.findMany({
      where: {
        botId,
        OR: [{ userId: user.id }, { recipientId: user.id }, { isPublic: true }],
      },
    })

    return {
      success: true,
      data,
      message: 'Chats fetched successfully.',
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    return {
      success: false,
      message,
      data: null,
      statusCode,
    }
  }
})
