// /server/api/chats/user/inbox/[id].get.ts
import { defineEventHandler, getRouterParam } from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { validateApiKey } from '../../../../utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      return errorHandler({
        error: new Error('Authorization required.'),
        context: 'Fetch Inbox Chats',
        statusCode: 401,
      })
    }

    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      return errorHandler({
        error: new Error('Invalid user ID. It must be a positive integer.'),
        context: 'Fetch Inbox Chats',
        statusCode: 400,
      })
    }

    const isAdmin = user.Role === 'ADMIN' || user.id === 1

    if (!isAdmin && user.id !== id) {
      return errorHandler({
        error: new Error('You can only view your own inbox.'),
        context: 'Fetch Inbox Chats',
        statusCode: 403,
      })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
      },
    })

    if (!targetUser) {
      return errorHandler({
        error: new Error('User not found.'),
        context: 'Fetch Inbox Chats',
        statusCode: 404,
      })
    }

    const username = targetUser.username || ''

    const chats = await prisma.chat.findMany({
      where: {
        isActive: true,
        OR: [
          { userId: id },
          { recipientId: id },
          ...(username ? [{ sender: username }, { recipient: username }] : []),
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return {
      success: true,
      message: `Fetched ${chats.length} inbox message(s).`,
      data: chats,
    }
  } catch (error) {
    return errorHandler({
      error,
      context: 'Fetch Inbox Chats',
      statusCode: 500,
    })
  }
})
