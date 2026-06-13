// /server/api/chats/user/human/[id].get.ts
import {
  defineEventHandler,
  getRouterParam,
  setHeader,
  setResponseStatus,
} from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { validateApiKey } from '../../../../utils/validateKey'

function fail(
  event: Parameters<Parameters<typeof defineEventHandler>[0]>[0],
  error: unknown,
  context = 'Fetch Human Chats by User ID',
  fallbackStatusCode = 500,
) {
  const handled = errorHandler({
    error,
    context,
    statusCode: fallbackStatusCode,
  })

  const statusCode = handled.statusCode || fallbackStatusCode

  setResponseStatus(event, statusCode)

  return {
    success: false,
    message: handled.message,
    data: null,
    statusCode,
  }
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')

  const requestedUserId = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
    return fail(
      event,
      new Error('Invalid User ID. It must be a positive integer.'),
      'Fetch Human Chats by User ID',
      400,
    )
  }

  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      return fail(
        event,
        new Error('Invalid or expired token.'),
        'Fetch Human Chats by User ID',
        401,
      )
    }

    const authUser = user as { id: number; isAdmin?: boolean }

    if (authUser.id !== requestedUserId && !authUser.isAdmin) {
      return fail(
        event,
        new Error('You can only fetch your own human chats.'),
        'Fetch Human Chats by User ID',
        403,
      )
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
    return fail(event, error)
  }
})
