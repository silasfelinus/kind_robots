// /server/api/dreams/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
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

    assertDreamAccess({
      dream: data,
      userId,
      userRole,
      action: 'view',
    })

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
