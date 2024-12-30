// /server/api/galleries/[id].patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  // Check if ID is valid
  if (isNaN(id) || id <= 0) {
    return {
      success: false,
      message: 'Invalid Gallery ID. It must be a positive integer.',
      statusCode: 400,
    }
  }

  try {
    // Authenticate user via API key
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Find the gallery to verify ownership
    const gallery = await prisma.gallery.findUnique({ where: { id } })
    if (!gallery) {
      throw createError({
        statusCode: 404,
        message: `Gallery with ID ${id} not found.`,
      })
    }

    if (gallery.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this gallery.',
      })
    }

    // Read and validate the request body
    const updatedGalleryData = await readBody(event)
    if (!updatedGalleryData || Object.keys(updatedGalleryData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the gallery
    const data = await prisma.gallery.update({
      where: { id },
      data: updatedGalleryData,
    })

    // Successful update response
    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Gallery with ID ${id} updated successfully.`,
      data,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || `Failed to update gallery with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})
