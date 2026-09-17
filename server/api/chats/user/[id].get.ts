// /server/api/chats/user/[id].get.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { validateApiKey } from '../../../utils/validateKey'
import { userIsAdmin } from '../../../utils/authUser'
import { getOptionalApiUser } from '@/server/utils/authGuard'
import { visibilityWhere } from '@/server/utils/contentAccess'

export default defineEventHandler(async (event) => {
  const requestedUserId = Number(getRouterParam(event, 'id'))

  try {
    if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid User ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    if (user.id !== requestedUserId && !userIsAdmin(user)) {
      throw createError({
        statusCode: 403,
        message: 'You can only fetch your own chats.',
      })
    }

    // Returned a user's conversations to any caller. The visibility fragment
    // narrows to public rows plus the VIEWER's own -- being named in the path
    // is not the same as being the person asking.
    const auth = await getOptionalApiUser(event)
    const data = await prisma.chat.findMany({
      where: {
        AND: [
          {
            isActive: true,
            OR: [{ userId: requestedUserId }, { recipientId: requestedUserId }],
          },
          await visibilityWhere(auth?.user, { isPublic: true, isMature: true }, auth?.isAdmin),
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 250,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      data,
      message: 'Chats fetched successfully.',
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to fetch Chats by User ID.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
