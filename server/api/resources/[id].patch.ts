// server/api/resources/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Resource } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let id: number | null = null
  let response

  try {
    // Parse and validate the resource ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid resource ID.',
      })
    }

    // Extract and validate the API key from the Authorization header
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

    const userId = user.id // Use userId from the validated token

    // Fetch the existing resource to ensure it exists
    const existingResource = await prisma.resource.findUnique({
      where: { id },
    })
    if (!existingResource) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: 'Resource not found.',
      })
    }

    // Check that the user is authorized to update the resource
    if (existingResource.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this resource.',
      })
    }

    // Parse the incoming request body as partial resource data
    const resourceData: Partial<Resource> = await readBody(event)

    // Update the resource in the database
    const updatedResource = await prisma.resource.update({
      where: { id },
      data: resourceData,
    })

    response = {
      success: true,
      resource: updatedResource,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to update resource with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
