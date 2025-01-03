// /server/api/resources/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let response
  let resourceId

  try {
    // Parse and validate the Resource ID
    resourceId = Number(event.context.params?.id)
    if (isNaN(resourceId) || resourceId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Resource ID. It must be a positive integer.',
      })
    }

    console.log(`Attempting to delete resource with ID: ${resourceId}`)

    // Extract and validate the Authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
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
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Verify the Resource exists and that the user is authorized to delete it
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { userId: true },
    })

    if (!resource) {
      throw createError({
        statusCode: 404,
        message: `Resource with ID ${resourceId} does not exist.`,
      })
    }

    if (resource.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this resource.',
      })
    }

    // Perform the deletion
    await prisma.resource.delete({ where: { id: resourceId } })
    console.log(`Successfully deleted resource with ID: ${resourceId}`)

    // Successful deletion response
    response = {
      success: true,
      message: `Resource with ID ${resourceId} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error deleting resource:', handledError)

    // Set response based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to delete resource with ID ${resourceId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
