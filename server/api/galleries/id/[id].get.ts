// /server/api/galleries/id/[id].get.ts

import { defineEventHandler } from 'h3'
import { fetchGalleryById } from '..'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  let response
  const id = Number(event.context.params?.id)

  if (isNaN(id) || id <= 0) {
    return errorHandler({
      error: new Error('Invalid Gallery ID. It must be a positive integer.'),
      context: 'Fetch Gallery',
      statusCode: 400,
    })
  }

  try {
    // Attempt to fetch the gallery by ID
    const gallery = await fetchGalleryById(id)

    if (!gallery) {
      return errorHandler({
        error: new Error(`Gallery with ID ${id} does not exist.`),
        context: 'Fetch Gallery',
        statusCode: 404,
      })
    }

    // Successful response
    response = {
      success: true,
      message: `Gallery with ID ${id} retrieved successfully.`,
      data: { gallery },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    // Error handling using errorHandler
    const handledError = errorHandler({
      error,
      context: 'Fetch Gallery',
    })
    response = {
      success: false,
      message: handledError.message,
      statusCode: handledError.statusCode || 500,
    }
    event.node.res.statusCode = response.statusCode
  }

  return response
})
