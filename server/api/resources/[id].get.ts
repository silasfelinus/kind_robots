// /server/api/resources/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let response
  const resourceId = Number(event.context.params?.id)

  try {
    // Validate ID format
    if (isNaN(resourceId) || resourceId <= 0) {
      response = {
        success: false,
        message: 'Invalid ID format. ID must be a positive integer.',
        data: null,
        statusCode: 400,
      }
      event.node.res.statusCode = 400
      return response
    }

    // Fetch resource
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    })

    // Resource not found
    if (!resource) {
      response = {
        success: false,
        message: 'Resource not found.',
        data: null,
        statusCode: 404,
      }
      event.node.res.statusCode = 404
      return response
    }

    // Successful retrieval
    response = {
      success: true,
      message: 'Resource retrieved successfully.',
      data: resource,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    response = {
      success: false,
      message: handledError.message || 'Failed to retrieve resource.',
      data: null,
      statusCode: handledError.statusCode || 500,
    }
    event.node.res.statusCode = response.statusCode
  }

  return response
})
