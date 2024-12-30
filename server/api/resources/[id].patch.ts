// /server/api/resources/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Resource } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const resourceId = Number(event.context.params?.id)

  try {
    // Validate the Resource ID
    if (isNaN(resourceId) || resourceId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid resource ID. It must be a positive integer.',
      })
    }

    // Use validateApiKey to authenticate
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
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
    if (!resourceData || Object.keys(resourceData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Perform the update operation
    const data = await prisma.resource.update({
      where: { id: resourceId },
      data: resourceData,
    })

    // Return success response
    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Resource with ID ${resourceId} updated successfully.`,
      data,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || `Failed to update resource with ID ${resourceId}.`,
      data: null,
    }
  }
})
