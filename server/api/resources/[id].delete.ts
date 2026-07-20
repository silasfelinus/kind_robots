// /server/api/resources/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'

export default defineEventHandler(async (event) => {
  let response
  let resourceId: number | null = null

  try {
    resourceId = Number(event.context.params?.id)

    if (Number.isNaN(resourceId) || resourceId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Resource ID. It must be a positive integer.',
      })
    }

    const { user, isAdmin } = await requireApiUser(event)

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { userId: true },
    })

    if (!resource) {
      throw createError({
        statusCode: 404,
        message: `Resource with ID ${resourceId} does not exist.`,
      })
    }

    if (!isAdmin && resource.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this resource.',
      })
    }

    await prisma.resource.delete({ where: { id: resourceId } })

    response = {
      success: true,
      message: `Resource with ID ${resourceId} successfully deleted.`,
      data: null,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to delete resource with ID ${resourceId}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
