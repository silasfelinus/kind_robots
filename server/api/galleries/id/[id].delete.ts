// server/api/galleries/[id].delete.ts

import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let id: number | null = null // Declare 'id' for broader scope

  try {
    // 1. Extract and validate the gallery ID from the request parameters
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Gallery ID. Gallery ID must be a positive integer.',
      })
    }

    console.log(`Attempting to delete gallery with ID: ${id}`)

    // 2. Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401, // Unauthorized
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
        statusCode: 401, // Unauthorized
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // 3. Fetch the gallery to verify ownership
    const gallery = await prisma.gallery.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!gallery) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404, // Not Found
        message: `Gallery with ID ${id} does not exist.`,
      })
    }

    // 4. Check if the logged-in user is the owner of the gallery
    if (gallery.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You do not have permission to delete this gallery.',
      })
    }

    // 5. Attempt to delete the gallery
    await prisma.gallery.delete({ where: { id } })

    console.log(`Gallery with ID ${id} successfully deleted`)
    response = {
      success: true,
      message: `Gallery with ID ${id} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error deleting gallery:', handledError)

    // Explicitly set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to delete gallery with ID ${id !== null ? id : 'unknown'}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
