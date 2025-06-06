// server/api/art/image/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async (event) => {
  let response
  let imageId: number | null = null

  try {
    // Parse and validate image ID
    imageId = Number(event.context.params?.id)
    if (isNaN(imageId) || imageId <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid image ID. It must be a positive integer.',
      })
    }

    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
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
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Check if the art image exists and verify ownership
    const artImage = await prisma.artImage.findUnique({
      where: { id: imageId },
    })
    if (!artImage) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Art image with ID ${imageId} not found.`,
      })
    }

    if (artImage.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this art image.',
      })
    }

    // Parse and validate request body
    const body = await readBody(event)
    const { imageData, fileName, fileType } = body

    if (!imageData && !fileName && !fileType) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message:
          'At least one field (imageData, fileName, or fileType) must be provided for update.',
      })
    }

    // Update the art image with validated data
    const data = await prisma.artImage.update({
      where: { id: imageId },
      data: {
        imageData: imageData ?? artImage.imageData,
        fileName: fileName ?? artImage.fileName,
        fileType: fileType ?? artImage.fileType,
      },
    })

    // Successful response with updated art image wrapped in a data object
    response = {
      success: true,
      data,
      message: 'Successfully retrieved art image',
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error updating art image:', handledError)

    // Set the appropriate status code based on the error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to update art image with ID ${imageId}.`,
    }
  }

  return response
})
