// /server/api/chats/user/[userId].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

export default defineEventHandler(async (event) => {
  const userId = Number(event.context.params?.userId)

  if (isNaN(userId) || userId <= 0) {
    return errorHandler({
      error: new Error('Invalid User ID. It must be a positive integer.'),
      context: 'Fetch Chats by User ID',
      statusCode: 400,
    })
  }

  try {
    // Authenticate the request
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      return errorHandler({
        error: new Error('Invalid or expired token.'),
        context: 'Fetch Chats by User ID',
        statusCode: 401,
      })
    }

    // Fetch chats based on user role or public visibility
    const data = await prisma.chat.findMany({
      where: {
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
