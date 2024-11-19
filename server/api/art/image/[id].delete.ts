// server/api/art/image/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  let imageId: number | null = null

  try {
    // 1. Validate and parse image ID
    imageId = Number(event.context.params?.id)
    if (isNaN(imageId) || imageId <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Image ID. It must be a positive integer.',
      })
    }

    // 2. Extract and validate the API key from the Authorization header
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401, // Unauthorized
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      throw createError({
        statusCode: 401, // Unauthorized
        message: 'Invalid or expired token.',
      })
    }
    const userId = user.id

    // 3. Fetch the art image and verify ownership
    const artImage = await prisma.artImage.findUnique({
      where: { id: imageId },
      select: { userId: true },
    })
    if (!artImage) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Art image with ID ${imageId} does not exist.`,
      })
    }

     // Check if user is an admin
    if (user.Role === 'ADMIN') {
      // Admin bypass: Delete the art entry directly
      await prisma.artImage.delete({ where: { id: imageId } })
      return {
        success: true,
        message: `Art Image with ID ${imageId} deleted successfully by admin.`,
      }
    }


    if (artImage.userId !== userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You do not have permission to delete this art image.',
      })
    }

    // 4. Attempt to delete the art image
    await prisma.artImage.delete({
      where: { id: imageId },
    })

    // Success response
    return {
      success: true,
      message: `Art image ${imageId} deleted successfully.`,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message ||
        `Failed to delete art image with ID ${imageId ?? 'unknown'}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
