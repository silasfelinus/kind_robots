// /server/api/achievements/records.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { getOptionalApiUser } from '../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await getOptionalApiUser(event)

    if (!auth) {
      event.node.res.statusCode = 200

      return {
        success: true,
        message: 'No achievement records for guest sessions.',
        data: [],
        statusCode: 200,
      }
    }

    const { user, isAdmin } = auth

    const data = await prisma.achievementRecord.findMany({
      where: isAdmin ? undefined : { userId: user.id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: isAdmin
        ? 'Achievement records fetched successfully.'
        : 'Your achievement records were fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to fetch achievement records.',
      data: [],
      statusCode,
    }
  }
})
