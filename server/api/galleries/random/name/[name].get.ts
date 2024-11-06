// ~/server/api/galleries/random/[name].get.ts
import { defineEventHandler, createError } from 'h3'
import { getRandomImageByGalleryName } from '../..'
import { errorHandler } from '../../utils/error'

interface RandomImageResponse {
  success: boolean
  message?: string
  data?: {
    image: string
  }
  error?: string
}

export default defineEventHandler(async (event): Promise<RandomImageResponse> => {
  let response: RandomImageResponse
  const galleryName = String(event.context.params?.name)

  if (!galleryName) {
    return {
      success: false,
      message: 'Invalid gallery name.',
      statusCode: 400,
    }
  }

  try {
    const image = await getRandomImageByGalleryName(galleryName)

    if (!image) {
      return {
        success: false,
        message: `No images found in gallery with name: ${galleryName}`,
        statusCode: 404,
      }
    }

    // Return success response with the fetched image
    response = {
      success: true,
      message: `Random image fetched from gallery: ${galleryName}.`,
      data: { image },
    }
  } catch (error: unknown) {
    // Handle the error using the centralized error handler
    const handledError = errorHandler(error)
    console.error(`Error fetching random image for gallery "${galleryName}":`, handledError)

    // Set the response based on the handled error
    response = {
      success: false,
      message: handledError.message || `Failed to get random image for gallery name ${galleryName}.`,
      error: handledError.message,
    }
  }

  return response
})
