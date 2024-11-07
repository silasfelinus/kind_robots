// /server/api/galleries/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

export default defineEventHandler(async (event) => {
  let response
  const id = Number(event.context.params?.id)

  if (isNaN(id) || id <= 0) {
    return errorHandler({
      error: new Error('Invalid Gallery ID. It must be a positive integer.'),
      context: 'Update Gallery',
      statusCode: 400,
    })
  }

  try {
    // Use the utility function to validate the API key
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      return errorHandler({
        error: new Error('Invalid or expired token.'),
        context: 'Update Gallery',
        statusCode: 401,
      })
    }

    const userId = user.id

    // Fetch the gallery to verify ownership
    const gallery = await prisma.gallery.findUnique({ where: { id } })
    if (!gallery) {
      return errorHandler({
        error: new Error(`Gallery with ID ${id} not found.`),
        context: 'Update Gallery',
        statusCode: 404,
      })
    }

    if (gallery.userId !== userId) {
      return errorHandler({
        error: new Error('You do not have permission to update this gallery.'),
        context: 'Update Gallery',
        statusCode: 403,
      })
    }

    // Parse and validate the request body
    const updatedGalleryData = await readBody(event)
    if (!updatedGalleryData || Object.keys(updatedGalleryData).length === 0) {
      return errorHandler({
        error: new Error('No data provided for update.'),
        context: 'Update Gallery',
        statusCode: 400,
      })
    }

    // Update the gallery
    const updatedGallery = await prisma.gallery.update({
      where: { id },
      data: updatedGalleryData,
    })

    response = {
      success: true,
      message: `Gallery with ID ${id} updated successfully.`,
      data: { gallery: updatedGallery },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler({
      error,
      context: 'Update Gallery',
    })

    // Explicitly set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to update gallery with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
