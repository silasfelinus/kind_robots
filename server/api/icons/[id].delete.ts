// /server/api/icons/[id].delete.ts
import { createError, defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid SmartIcon ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const icon = await prisma.smartIcon.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!icon) {
      throw createError({
        statusCode: 404,
        message: `SmartIcon with ID ${id} does not exist.`,
      })
    }

    if (icon.userId !== user.id && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to delete this SmartIcon.',
      })
    }

    const deleted = await prisma.smartIcon.delete({ where: { id } })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `SmartIcon with ID ${id} successfully deleted.`,
      data: deleted,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || `Failed to delete SmartIcon with ID ${id}.`,
      data: null,
      statusCode,
    }
  }
})
