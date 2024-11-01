// /server/api/galleries/[id].patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { fetchGalleryById, updateGallery } from '..'
import { errorHandler } from '../../utils/error'
import { verifyJwtToken } from '../../auth'
import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Extract and validate the ID from the request parameters
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Gallery ID.',
      })
    }

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

    // Fetch the gallery to verify ownership
    const gallery = await fetchGalleryById(id)
    if (!gallery) {
      throw createError({
        statusCode: 404,
        message: 'Gallery not found.',
      })
    }

    // Verify ownership of the gallery
    if (gallery.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this gallery.',
      })
    }

    // Parse and validate the request body as partial update input
    const data: Prisma.GalleryUpdateInput = await readBody(event)
    if (!data || Object.keys(data).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the gallery with the provided fields
    const updatedGallery = await updateGallery(id, data)

    return { success: true, gallery: updatedGallery }
  } catch (error: unknown) {
    // Handle and format the error
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message || `Failed to update Gallery with id ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
