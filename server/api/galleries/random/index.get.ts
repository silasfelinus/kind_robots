// server/api/galleries/random/index.get.ts
import { defineEventHandler } from 'h3'
import { randomGallery } from '..' // Adjusted import path to match file structure
import { errorHandler } from '../../utils/error' // Import your error handler

export default defineEventHandler(async () => {
  try {
    const gallery = await randomGallery()

    if (!gallery || !gallery.name) {
      return {
        success: false,
        message: 'No galleries available.',
        statusCode: 404, // Not Found
      }
    }

    // Return success response with the gallery name
    return {
      success: true,
      message: `Random gallery fetched successfully.`,
      data: { galleryName: gallery.name },
      statusCode: 200, // OK
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(`Error fetching random gallery:`, handledError)

    // Return error response with status code
    return {
      success: false,
      message: 'Failed to fetch a random gallery name.',
      error: handledError.message || 'Unknown error',
      statusCode: handledError.statusCode || 500, // Internal Server Error
    }
  }
})
