// /server/api/dreams/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import { existsActiveGrant } from '@/server/utils/contentAccess'
import { assertDreamAccess, dreamInclude, getDreamId } from './index'

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = getDreamId(event)

    const { isValid, user } = await validateApiKey(event)
    const userId = isValid && user ? user.id : null
    const userRole = isValid && user ? user.Role : null

    const data = await prisma.dream.findUnique({
      where: { id },
      include: dreamInclude,
    })

    if (!data) {
      throw createError({
        statusCode: 404,
        message: `Dream with ID ${id} not found.`,
      })
    }

    try {
      assertDreamAccess({
        dream: data,
        userId,
        userRole,
        action: 'view',
      })
    } catch (accessError) {
      // Not the owner, not admin, not public -- last chance is an active
      // PACK Grant on this Dream's packId (digital-storefront/t-004: DLC
      // catalog wiring). Only checked once assertDreamAccess has already
      // ruled out every other path, so its own error/message stays the
      // fallback for every case this doesn't cover.
      const packGranted =
        data.packId != null &&
        userId != null &&
        (await existsActiveGrant(userId, 'PACK', data.packId))
      if (!packGranted) throw accessError
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Dream fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || `Failed to fetch Dream with ID ${id}.`,
      data: null,
      statusCode,
    }
  }
})
