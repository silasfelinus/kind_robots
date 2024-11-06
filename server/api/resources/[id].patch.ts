// server/api/resources/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Resource } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let response
  const resourceId = Number(event.context.params?.id)

  try {
    // Validate the Resource ID
    if (isNaN(resourceId) || resourceId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid resource ID. It must be a positive integer.',
      })
    }

    // Validate the Authorization token
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

    // Fetch and validate resource ownership
    const existingResource = await prisma.resource.findUnique({
      where: { id: resourceId },
    })
    if (!existingResource) {
      throw createError({
        statusCode: 404,
        message: 'Resource not found.',
      })
    }

    if (existingResource.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this resource.',
      })
    }

    // Parse and validate the request body data
    const resourceData: Partial<Resource> = await readBody(event)

    // Perform the update operation
    const updatedResource = await prisma.resource.update({
      where: { id: resourceId },
      data: resourceData,
    })

    // Successful update response
    response = {
      success: true,
      message: `Resource with ID ${resourceId} updated successfully.`,
      data: updatedResource,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to update resource with ID ${resourceId}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
