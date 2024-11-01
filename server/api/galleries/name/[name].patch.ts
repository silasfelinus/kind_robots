// /server/api/galleries/[name].patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { fetchGalleryByName, updateGallery } from '..' // Import the correct methods
import { verifyJwtToken } from '../../auth'

export default defineEventHandler(async (event) => {
  // Extract and validate the gallery name from the request parameters
  const name = String(event.context.params?.name).trim()
  if (!name) {
    throw createError({
      statusCode: 400,
      message: 'Gallery name is required.',
    })
  }

  try {
    // Extract and validate the JWT token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // Fetch the gallery by its name and check if it exists
    const gallery = await fetchGalleryByName(name)
    if (!gallery) {
      throw createError({
        statusCode: 404,
        message: `Gallery with name '${name}' not found.`,
      })
    }

    // Verify ownership of the gallery
    if (gallery.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this gallery.',
      })
    }

    // Read and parse the body of the request
    const data = await readBody(event)
    if (!data || Object.keys(data).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the gallery using its ID and the provided data
    const updatedGallery = await updateGallery(gallery.id, data)

    return { success: true, gallery: updatedGallery }
  } catch (error: unknown) {
    // Handle any errors that occur during the update process
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      message: `Failed to update gallery with name '${name}'. Reason: ${errorMessage}`,
      statusCode: 500,
    }
  }
})
