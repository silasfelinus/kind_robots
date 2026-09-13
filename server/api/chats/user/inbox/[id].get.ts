// /server/api/chats/user/inbox/[id].get.ts
import { defineEventHandler, getRouterParam } from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { validateApiKey } from '../../../../utils/validateKey'
import { userIsAdmin } from '../../../../utils/authUser'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      event.node.res.statusCode = 401
      return {
        success: false,
        message: 'Authorization required.',
        statusCode: 401,
      }
    }

    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      event.node.res.statusCode = 400
      return {
        success: false,
        message: 'Invalid user ID. It must be a positive integer.',
        statusCode: 400,
      }
    }

    const isAdmin = userIsAdmin(user)

    if (!isAdmin && user.id !== id) {
      event.node.res.statusCode = 403
      return {
        success: false,
        message: 'You can only view your own inbox.',
        statusCode: 403,
      }
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
      },
    })

    if (!targetUser) {
      event.node.res.statusCode = 404
      return {
        success: false,
        message: 'User not found.',
        statusCode: 404,
      }
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
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
