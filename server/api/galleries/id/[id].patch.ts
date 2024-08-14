// /server/api/galleries/[id].patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { fetchGalleryById, updateGallery } from '..'
import { errorHandler } from '../../utils/error'
import type { Prisma } from '@prisma/client' // Ensure Prisma types are imported

export default defineEventHandler(async (event) => {
  // Extract and validate the ID from the request parameters
  const id = Number(event.context.params?.id)

  if (isNaN(id) || id <= 0) {
    throw createError({
      statusCode: 400, // Bad Request
      message: 'Invalid Gallery ID.',
    })
  }

  try {
    // Fetch the Gallery from the database
    const gallery = await fetchGalleryById(id)

    if (!gallery) {
      throw createError({
        statusCode: 404, // Not Found
        message: 'Gallery not found.',
      })
    }

    // Parse and validate the request body
    const data: Prisma.GalleryUpdateInput = await readBody(event)

    // Update only the provided fields
    const updatedGallery = await updateGallery(id, data)

    return { success: true, gallery: updatedGallery }
  } catch (error: unknown) {
    // Use errorHandler to handle and format the error
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message || `Failed to update Gallery with id ${id}.`,
      statusCode: handledError.statusCode || 500, // Internal Server Error
    }
  }
})
