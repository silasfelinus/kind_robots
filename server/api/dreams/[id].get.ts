// /server/api/dreams/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { getOptionalApiUser } from '@/server/utils/authGuard'
import { canView } from '@/server/utils/contentAccess'
import { dreamInclude, getDreamId } from './index'

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = getDreamId(event)
    const auth = await getOptionalApiUser(event)

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

    if (!(await canView(data, null, auth?.user))) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to view this Dream.',
      })
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
