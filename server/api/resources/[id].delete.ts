// /server/api/resources/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { verifyJwtToken } from '../auth'

export default defineEventHandler(async (event) => {
  let resourceId: number | null = null

  try {
    // Parse and validate the resource ID
    resourceId = Number(event.context.params?.id)
    if (isNaN(resourceId) || resourceId <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid resource ID. ID must be a positive integer.',
      })
    }

    console.log(`Attempting to delete resource with ID: ${resourceId}`)

    // Extract and verify the JWT token from the request
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

    // Check if the resource exists and if the user is authorized to delete it
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    })

    if (!resource) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Resource with ID ${resourceId} not found.`,
      })
    }

    if (resource.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You do not have permission to delete this resource.',
      })
    }

    // Delete the resource
    await prisma.resource.delete({ where: { id: resourceId } })

    console.log(`Successfully deleted resource with ID: ${resourceId}`)

    return {
      success: true,
      message: `Resource with ID ${resourceId} successfully deleted.`,
    }
  } catch (error: unknown) {
    console.error('Error deleting resource:', error)
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message ||
        `Failed to delete resource with ID ${resourceId}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
