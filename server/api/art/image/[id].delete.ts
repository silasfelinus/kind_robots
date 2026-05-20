// server/api/art/image/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'

export default defineEventHandler(async (event) => {
  let imageId: number | null = null

  try {
    imageId = Number(event.context.params?.id)

    if (!Number.isInteger(imageId) || imageId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Image ID. It must be a positive integer.',
      })
    }

    const authorizationHeader = event.node.req.headers.authorization

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]?.trim()

    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'Authorization token is empty.',
      })
    }

    const user = await prisma.user.findFirst({
      where: {
        apiKey: token,
      },
      select: {
        id: true,
        Role: true,
      },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const artImage = await prisma.artImage.findUnique({
      where: {
        id: imageId,
      },
      select: {
        userId: true,
      },
    })

    if (!artImage) {
      throw createError({
        statusCode: 404,
        message: `Art image with ID ${imageId} does not exist.`,
      })
    }

    if (user.Role !== 'ADMIN' && artImage.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this art image.',
      })
    }

    await prisma.artImage.delete({
      where: {
        id: imageId,
      },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message:
        user.Role === 'ADMIN'
          ? `Art Image with ID ${imageId} deleted successfully by admin.`
          : `Art image ${imageId} deleted successfully.`,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)

    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message:
        handledError.message ||
        `Failed to delete art image with ID ${imageId ?? 'unknown'}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})
