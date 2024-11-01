// /server/api/galleries/[name].patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  let response
  const name = String(event.context.params?.name).trim()

  try {
    // Validate the gallery name
    if (!name) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Gallery name is required.',
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

    // Fetch the gallery by its name to ensure it exists and belongs to the user
    const gallery = await prisma.gallery.findUnique({
      where: { name },
    })
    if (!gallery) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Gallery with name '${name}' not found.`,
      })
    }

    if (gallery.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this gallery.',
      })
    }

    // Read and validate the request body
    const updatedGalleryData = await readBody(event)
    if (!updatedGalleryData || Object.keys(updatedGalleryData).length === 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the gallery with validated data
    const updatedGallery = await prisma.gallery.update({
      where: { id: gallery.id },
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
      `Failed to update gallery with name "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
    )

    // Set the appropriate status code based on the error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to update gallery with name '${name}'.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
