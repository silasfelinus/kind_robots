import { createError, defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { getOptionalApiUser } from '../../utils/authGuard'
import { canView } from '../../utils/contentAccess'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid ID. It must be a positive integer.',
      })
    }

    const [data, auth] = await Promise.all([
      prisma.character.findUnique({ where: { id } }),
      getOptionalApiUser(event),
    ])

    if (!data) {
      throw createError({ statusCode: 404, message: 'Character not found.' })
    }

    if (!(await canView(data, null, auth?.user))) {
      throw createError({
        statusCode: auth ? 403 : 404,
        message: auth
          ? 'You do not have permission to view this Character.'
          : 'Character not found.',
      })
    }

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Character details fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
