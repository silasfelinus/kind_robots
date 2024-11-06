// server/api/galleries/random/image/index.get.ts
import { defineEventHandler, createError } from 'h3'
import { fetchRandomImage } from '../..'
import { errorHandler } from '../../../utils/error'

interface RandomImageResponse {
  success: boolean
  message?: string
  data?: {
    image: string
  }
  error?: string
}

export default defineEventHandler(async (): Promise<RandomImageResponse> => {
  let response: RandomImageResponse

  try {
    // Fetch a random image
    const image = await fetchRandomImage()

    // Check if an image was found
    if (!image) {
      throw createError({
        statusCode: 404,
        message: 'No images available.',
      })
    }

    // Return the success response with the image
    response = {
      success: true,
      message: 'Random image fetched successfully.',
      data: { image },
    }
  } catch (error: unknown) {
    // Handle the error using a centralized error handler
    const handledError = errorHandler(error)
    console.error('Error fetching random image:', handledError)

    // Set the response based on the handled error
    response = {
      success: false,
      message: handledError.message || 'Failed to fetch a random image.',
      error: handledError.message,
    }
  }

  return response
})
