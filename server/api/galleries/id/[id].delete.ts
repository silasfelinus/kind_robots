// server/api/galleries/[id].delete.ts

import { defineEventHandler, createError } from 'h3'
import { deleteGallery, fetchGalleryById } from '..'
import { errorHandler } from '../../utils/error'
import { verifyJwtToken } from '../../auth'

export default defineEventHandler(async (event) => {
  let id: number | null = null // Declare 'id' for broader scope

  try {
    // 1. Extract and validate the gallery ID from the request parameters
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Gallery ID. Gallery ID must be a positive integer.',
      })
    }

    // 2. Extract the token from the Authorization header
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401, // Unauthorized
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401, // Unauthorized
        message: 'Invalid or expired token.',
      })
    }

    // 3. Fetch the gallery to verify ownership
    const gallery = await fetchGalleryById(id)
    if (!gallery) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Gallery with ID ${id} does not exist.`,
      })
    }

    // 4. Check if the logged-in user is the owner of the gallery
    if (gallery.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You do not have permission to delete this gallery.',
      })
    }

    // 5. Attempt to delete the gallery
    const deleted = await deleteGallery(id)
    if (!deleted) {
      throw createError({
        statusCode: 500, // Internal Server Error
        message: `Failed to delete gallery with ID ${id}.`,
      })
    }

    // Success response
    return {
      success: true,
      message: `Gallery with ID ${id} successfully deleted.`,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message ||
        `Failed to delete gallery with ID ${id !== null ? id : 'unknown'}.`, // Handles when 'id' is undefined
      statusCode: handledError.statusCode || 500,
    }
  }
})
