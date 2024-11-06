// server/api/art/image/imagebyart/[id].get.ts
import { defineEventHandler } from 'h3'
import { PrismaClient } from '@prisma/client'
import { errorHandler } from '@/server/api/utils/error'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // Extract artId from route parameters and ensure it is a valid number
    const artId = Number(event.context.params?.id)

    if (isNaN(artId) || artId <= 0) {
      return errorHandler({
        success: false,
        message: 'Invalid art ID provided',
        statusCode: 400,
      })
    }

    // Query the ArtImage by artId
    const artImage = await prisma.artImage.findUnique({
      where: { artId },
    })

    // If no artImage is found, return a 404 error
    if (!artImage) {
      return errorHandler({
        success: false,
        message: `ArtImage with artId ${artId} not found`,
        statusCode: 404,
      })
    }

    // Return the found ArtImage wrapped in a data object
    return {
      success: true,
      data: { artImage },
    }
  } catch (error) {
    // Handle any unexpected errors
    return errorHandler({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Unknown error occurred while fetching the art image',
      statusCode: 500,
    })
  }
})
