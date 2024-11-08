// /server/api/chats/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  if (isNaN(id) || id <= 0) {
    return errorHandler({
      error: new Error('Invalid Chat ID. It must be a positive integer.'),
      context: 'Fetch Single Chat',
      statusCode: 400,
    })
  }

  try {
    // Authenticate the request
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      return errorHandler({
        error: new Error('Invalid or expired token.'),
        context: 'Fetch Single Chat',
        statusCode: 401,
      })
    }

    // Fetch the chat by ID, including access control for user and public visibility
    const chat = await prisma.chat.findFirst({
      where: {
        id,
        OR: [{ userId: user.id }, { recipientId: user.id }, { isPublic: true }],
      },
    })

    if (!chat) {
      return errorHandler({
        error: new Error(`Chat with ID ${id} not found or access denied.`),
        context: 'Fetch Single Chat',
        statusCode: 404,
      })
    }

    return {
      success: true,
      data: chat,
      message: 'Chat fetched successfully.',
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
