// /server/api/resources/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { getOptionalApiUser } from '../../utils/authGuard'
import { resourceGallerySelect, resourceGalleryWhere } from './gallery'

export default defineEventHandler(async (event) => {
  const resourceId = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(resourceId) || resourceId <= 0) {
      event.node.res.statusCode = 400
      return {
        success: false,
        message: 'Invalid ID format. ID must be a positive integer.',
        data: null,
        statusCode: 400,
      }
    }

    const auth = await getOptionalApiUser(event)
    const resource = await prisma.resource.findFirst({
      where: {
        AND: [
          { id: resourceId },
          resourceGalleryWhere({
            userId: auth?.user.id ?? null,
            isAdmin: auth?.isAdmin ?? false,
            showMature: Boolean(auth?.user.showMature),
          }),
        ],
      },
      select: resourceGallerySelect,
    })

    if (!resource) {
      event.node.res.statusCode = 404
      return {
        success: false,
        message: 'Resource not found.',
        data: null,
        statusCode: 404,
      }
    }

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Resource retrieved successfully.',
      data: resource,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    const statusCode = handledError.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handledError.message || 'Failed to retrieve resource.',
      data: null,
      statusCode,
    }
  }
})
