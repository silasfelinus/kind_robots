// /server/api/chats/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { isMaturityRestricted } from '../../utils/contentAccess'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  if (isNaN(id) || id <= 0) {
    event.node.res.statusCode = 400
    return {
      success: false,
      message: 'Invalid Chat ID. It must be a positive integer.',
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

    // Fetch the chat by ID, including access control for user and public visibility
    const chat = await prisma.chat.findFirst({
      where: {
        id,
        ...(isMaturityRestricted(user) ? { isMature: false } : {}),
        OR: [{ userId: user.id }, { recipientId: user.id }, { isPublic: true }],
      },
    })

    if (!chat) {
      event.node.res.statusCode = 404
      return {
        success: false,
        message: `Chat with ID ${id} not found or access denied.`,
        data: null,
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: chat,
      message: 'Chat fetched successfully.',
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
