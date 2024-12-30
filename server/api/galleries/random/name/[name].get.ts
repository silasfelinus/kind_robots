//server/api/galleries/random/name/[name].get.ts
import { defineEventHandler } from 'h3'
import { getRandomImageByGalleryName } from '../..'
import { errorHandler } from '../../../utils/error'

interface RandomImageResponse {
  success: boolean
  message: string
  data?: string // Direct string path for the image
  statusCode: number
}

export default defineEventHandler(async (event): Promise<RandomImageResponse> => {
  const galleryName = String(event.context.params?.name).trim()

  if (!galleryName) {
    return {
      success: false,
      message: 'Invalid gallery name.',
      statusCode: 400, // Bad Request
    }
  }

  try {
    // Fetch a random image path from the specified gallery
    const imagePath = await getRandomImageByGalleryName(galleryName)

    if (!imagePath) {
      return {
        success: false,
        message: `No images found in gallery with name: ${galleryName}.`,
        statusCode: 404, // Not Found
      }
    }

    // Compose the final image path
    const data = `/images/${galleryName}/${imagePath}`

    // Return success response with the composed image path
    return {
      success: true,
      message: `Random image fetched successfully from gallery: ${galleryName}.`,
      data,
      statusCode: 200, // OK
    }
  } catch (error: unknown) {
    // Handle the error using the centralized error handler
    const handledError = errorHandler(error)
    console.error(
      `Error fetching random image for gallery "${galleryName}":`,
      handledError,
    )

    // Return a formatted error response
    return {
      success: false,
      message:
        handledError.message ||
        `Failed to get random image for gallery name: ${galleryName}.`,
      statusCode: handledError.statusCode || 500, // Internal Server Error
    }
  }
})
