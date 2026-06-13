// /server/api/chats/user/human/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { validateApiKey } from '../../../../utils/validateKey'

export default defineEventHandler(async (event) => {
  const requestedUserId = Number(event.context.params?.id)

  if (!Number.isFinite(requestedUserId) || requestedUserId <= 0) {
    return errorHandler({
      error: new Error('Invalid User ID. It must be a positive integer.'),
      context: 'Fetch Human Chats by User ID',
      statusCode: 400,
    })
  }

  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      return errorHandler({
        error: new Error('Invalid or expired token.'),
        context: 'Fetch Human Chats by User ID',
        statusCode: 401,
      })
    }

    const authUser = user as { id: number; isAdmin?: boolean }

    if (authUser.id !== requestedUserId && !authUser.isAdmin) {
      return errorHandler({
        error: new Error('You can only fetch your own human chats.'),
        context: 'Fetch Human Chats by User ID',
        statusCode: 403,
      })
    }

    const data = await prisma.chat.findMany({
      where: {
        type: 'ToUser',
        isActive: true,
        OR: [{ userId: requestedUserId }, { recipientId: requestedUserId }],
        botId: null,
        botName: null,
        botResponse: null,
        characterId: null,
        dreamId: null,
        channel: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 250,
    })

    return {
      success: true,
      data,
      message: 'Human chats fetched successfully.',
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
