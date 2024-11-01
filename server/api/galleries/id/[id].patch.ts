// /server/api/galleries/[id].patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  let response
  let id: number | null = null

  try {
    // Validate gallery ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid Gallery ID. It must be a positive integer.',
      })
    }

    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Fetch the gallery to verify ownership
    const gallery = await prisma.gallery.findUnique({ where: { id } })
    if (!gallery) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: 'Gallery not found.',
      })
    }

    if (gallery.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this gallery.',
      })
    }

    // Parse and validate the request body
    const updatedGalleryData = await readBody(event)
    if (!updatedGalleryData || Object.keys(updatedGalleryData).length === 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the gallery
    const updatedGallery = await prisma.gallery.update({
      where: { id },
      data: updatedGalleryData,
    })

    response = {
      success: true,
      gallery: updatedGallery,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(
      `Failed to update gallery with ID "${id}": ${error instanceof Error ? error.message : 'Unknown error'}`,
    )

    // Set appropriate status code based on the error
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
