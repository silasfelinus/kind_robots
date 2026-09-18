// /server/api/chats/bot/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { validateApiKey } from '../../../utils/validateKey'
import { viewerShowsMature } from '../../../utils/contentAccess'

export default defineEventHandler(async (event) => {
  const botId = Number(event.context.params?.id)

  if (isNaN(botId) || botId <= 0) {
    event.node.res.statusCode = 400
    return {
      success: false,
      message: 'Invalid Bot ID. It must be a positive integer.',
      data: null,
      statusCode: 400,
    }
  }

  try {
    // Authenticate the request
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      event.node.res.statusCode = 401
      return {
        success: false,
        message: 'Invalid or expired token.',
        data: null,
        statusCode: 401,
      }
    }

    // Fetch chats involving the specified bot with access control
    const data = await prisma.chat.findMany({
      where: {
        botId,
        ...(viewerShowsMature(user) ? {} : { isMature: false }),
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
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message,
      data: null,
      statusCode,
    }
  }
})
