// server/api/art/image/[id].delete.ts

import { defineEventHandler, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { verifyJwtToken } from '../../auth'

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

    // 2. Check for Authorization header and verify JWT token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401, // Unauthorized
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401, // Unauthorized
        message: 'Invalid or expired token.',
      })
    }

    // 3. Fetch the art image and verify ownership
    const artImage = await prisma.artImage.findUnique({
      where: { id: imageId },
    })
    if (!artImage) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Art image with ID ${imageId} does not exist.`,
      })
    }

    // Check if the authenticated user is the owner of the art image
    if (artImage.userId !== verificationResult.userId) {
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
    }
  } catch (error: unknown) {
    // Use errorHandler for consistent error responses
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
