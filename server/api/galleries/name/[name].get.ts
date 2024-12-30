// server/api/galleries/[name].get.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { fetchGalleryByName } from '..'

export default defineEventHandler(async (event) => {
  const name = String(event.context.params?.name).trim()

  if (!name) {
    return errorHandler({
      error: new Error('Gallery name is required.'),
      context: 'Fetch Gallery By Name',
      statusCode: 400, // Bad Request
    })
  }

  try {
    // Fetch the gallery by name
    const gallery = await fetchGalleryByName(name)

    if (!gallery) {
      return errorHandler({
        error: new Error(`Gallery with name '${name}' does not exist.`),
        context: 'Fetch Gallery By Name',
        statusCode: 404, // Not Found
      })
    }

    return {
      success: true,
      message: `Gallery '${name}' fetched successfully.`,
      data: { gallery },
      statusCode: 200,
    }
  } catch (error: unknown) {
    // Handle any unexpected errors
    const handledError = errorHandler({
      error,
      context: 'Fetch Gallery By Name',
    })

    // Use standardized error response format
    return {
      success: false,
      message: handledError.message || `Failed to fetch gallery with name '${name}'.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
