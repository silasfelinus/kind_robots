// ~/server/api/galleries/random/id/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import { getRandomGalleryImage } from '../..'
import { errorHandler } from '../../../utils/error'

export default defineEventHandler(async (event) => {
  let response
  const id = Number(event.context.params?.id)

  try {
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Gallery ID. It must be a positive integer.',
      })
    }

    // Fetch a random image from the specified gallery
    const image = await getRandomGalleryImage(id)
    if (!image) {
      throw createError({
        statusCode: 404,
        message: `No images found in the gallery with ID ${id}.`,
      })
    }

    // Successful response with image data
    response = {
      success: true,
      message: 'Random image retrieved successfully.',
      data: { image },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error fetching random gallery image:', handledError)

    // Set the response and status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to get random image.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
