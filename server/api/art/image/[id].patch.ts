// server/api/art/image/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'
import { verifyJwtToken } from '../../auth'

export default defineEventHandler(async (event) => {
  try {
    const imageId = Number(event.context.params?.id)

    // Validate imageId
    if (isNaN(imageId) || imageId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid image ID. It must be a positive integer.',
      })
    }

    // Extract and validate the JWT token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // Check if the art image exists
    const artImage = await prisma.artImage.findUnique({
      where: { id: imageId },
    })
    if (!artImage) {
      throw createError({
        statusCode: 404,
        message: `Art image with ID ${imageId} not found.`,
      })
    }

    // Verify ownership of the art image
    if (artImage.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this art image.',
      })
    }

    // Parse and validate request body
    const body = await readBody(event)
    const { imageData, fileName, fileType } = body

    // Ensure at least one field is provided for update
    if (!imageData && !fileName && !fileType) {
      throw createError({
        statusCode: 400,
        message:
          'At least one field (imageData, fileName, or fileType) must be provided for update.',
      })
    }

    // Update the art image with validated data
    const updatedArtImage = await prisma.artImage.update({
      where: { id: imageId },
      data: {
        imageData: imageData ?? artImage.imageData,
        fileName: fileName ?? artImage.fileName,
        fileType: fileType ?? artImage.fileType,
      },
    })

    return { success: true, artImage: updatedArtImage }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message: handledError.message || `Failed to update art image with ID.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
