// /server/api/rewards/character/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { validateApiKey } from '../../../utils/validateKey'
import { getOptionalApiUser } from '@/server/utils/authGuard'
import { visibilityWhere } from '@/server/utils/contentAccess'

export default defineEventHandler(async (event) => {
  const characterId = Number(event.context.params?.id)

  if (isNaN(characterId) || characterId <= 0) {
    event.node.res.statusCode = 400
    return {
      success: false,
      message: 'Invalid Character ID. It must be a positive integer.',
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

    // Fetch rewards linked to the specified character with access control
    const auth = await getOptionalApiUser(event)
    const data = await prisma.reward.findMany({
      where: {
        AND: [
          { Characters: { some: { id: characterId } } },
          await visibilityWhere(
            auth?.user,
            // Reward carries packId, so a PACK grant must not be filtered out.
            { isPublic: true, isMature: true, packGated: true },
            auth?.isAdmin,
          ),
        ],
      },
    })

    return {
      success: true,
      data,
      message: 'Rewards fetched successfully.',
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
