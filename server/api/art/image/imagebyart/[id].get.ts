import { defineEventHandler, useQuery } from 'h3'
import { PrismaClient } from '@prisma/client'
import { errorHandler } from '@/server/api/utils/error'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // Extract artId from the route parameters
    const { id: artId } = event.context.params

    // Convert artId to a number to use in the query
    const numericArtId = parseInt(artId, 10)

    // Validate the artId
    if (isNaN(numericArtId)) {
      return errorHandler({
        success: false,
        message: 'Invalid art ID',
        statusCode: 400,
      })
    }

    // Query the ArtImage by artId
    const artImage = await prisma.artImage.findUnique({
      where: { artId: numericArtId },
    })

    // If no artImage is found, return a 404 error
    if (!artImage) {
      return errorHandler({
        success: false,
        message: `ArtImage with artId ${artId} not found`,
        statusCode: 404,
      })
    }

    // Return the found ArtImage
    return {
      success: true,
      artImage,
    }
  } catch (error) {
    // Handle any unexpected errors
    return errorHandler({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    })
  }
})
