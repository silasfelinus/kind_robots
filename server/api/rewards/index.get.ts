// /server/api/rewards/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { rewardInclude } from './'
import { errorHandler } from '../../utils/error'
import { getOptionalApiUser } from '../../utils/authGuard'
import { viewablePackIds } from '../../utils/contentAccess'

export default defineEventHandler(async (event) => {
  try {
    const auth = await getOptionalApiUser(event)
    const userId = auth?.user.id ?? null
    const isAdmin = auth?.isAdmin ?? false
    const packIds = userId && !isAdmin ? await viewablePackIds(userId) : []

    const visibility = isAdmin
      ? {}
      : userId
        ? {
            OR: [
              { isPublic: true },
              { userId },
              ...(packIds.length ? [{ packId: { in: packIds } }] : []),
            ],
          }
        : { isPublic: true }

    const data = await prisma.reward.findMany({
      where: {
        isActive: true,
        ...visibility,
      },
      include: rewardInclude,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to fetch rewards.',
      statusCode: event.node.res.statusCode,
    }
  }
})
