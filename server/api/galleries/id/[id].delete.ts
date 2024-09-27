// server/api/galleries/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { deleteGallery, fetchGalleryById } from '..'
import { errorHandler } from '../../utils/error'
import { verifyJwtToken } from '../../auth'

export default defineEventHandler(async (event) => {
  let id: number | null = null; // Declare 'id' outside of try-catch for broader scope

  try {
    // Extract and validate the gallery ID from the request parameters
    id = Number(event.context.params?.id) // Reverting back to 'id' for clarity
    
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Gallery ID.',
      })
    }

    // Extract the token from the Authorization header
    const authorizationHeader = event.req.headers['authorization']
    if (!authorizationHeader) {
      throw createError({
        statusCode: 401, // Unauthorized
        message: 'Authorization token is required.',
      })
    }

    // Assuming the token is prefixed with 'Bearer'
    const token = authorizationHeader.split(' ')[1]
    if (!token) {
      throw createError({
        statusCode: 401, // Unauthorized
        message: 'Invalid authorization format. Expected Bearer token.',
      })
    }

    // Verify the JWT token and fetch user details
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult.userId) {
      throw createError({
        statusCode: 401, // Unauthorized
        message: 'Invalid token.',
      })
    }

    // Find the gallery to check if the user is the owner
    const gallery = await fetchGalleryById(id) // Using 'id' consistently
    if (!gallery) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Gallery with id ${id} does not exist.`,
      })
    }

    // Check if the logged-in user is the owner of the gallery
    if (gallery.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You are not authorized to delete this gallery.',
      })
    }

    // Attempt to delete the gallery
    const deleted = await deleteGallery(id) // Using 'id' consistently
    if (!deleted) {
      throw createError({
        statusCode: 500, // Internal Server Error
        message: `Failed to delete gallery with id ${id}.`,
      })
    }

    return {
      success: true,
      message: `Gallery with id ${id} successfully deleted.`,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message: handledError.message || `Failed to delete gallery with id ${id !== null ? id : 'unknown'}.`, // Handle the case when 'id' is not defined
      statusCode: handledError.statusCode || 500,
    }
  }
})
