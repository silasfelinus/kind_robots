import { createError, defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { getOptionalApiUser } from '../../utils/authGuard'
import { canView, viewablePackIds } from '../../utils/contentAccess'

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id ? Number(event.context.params.id) : null
    const auth = await getOptionalApiUser(event)
    const userId = auth?.user.id ?? null
    const isAdmin = auth?.isAdmin ?? false

    if (id !== null && (!Number.isInteger(id) || id <= 0)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid ID. It must be a positive integer.',
      })
    }

    if (id !== null) {
      const data = await prisma.character.findUnique({ where: { id } })

      if (!data) {
        throw createError({
          statusCode: 404,
          message: `Character with ID ${id} not found.`,
        })
      }

      if (!(await canView(data, null, auth?.user))) {
        throw createError({
          statusCode: auth ? 403 : 404,
          message: auth
            ? 'You do not have permission to view this Character.'
            : 'Character not found.',
        })
      }

      return {
        success: true,
        message: `Character with ID ${id} fetched successfully.`,
        data,
        statusCode: 200,
      }
    }

    const packIds = userId && !isAdmin ? await viewablePackIds(userId) : []
    const where = isAdmin
      ? undefined
      : userId
        ? {
            OR: [
              { isPublic: true },
              { userId },
              ...(packIds.length ? [{ packId: { in: packIds } }] : []),
            ],
          }
        : { isPublic: true }

    const data = await prisma.character.findMany({ where })

    return {
      success: true,
      message: 'All viewable characters fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
