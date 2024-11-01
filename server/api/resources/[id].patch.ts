// /server/api/resources/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { verifyJwtToken } from '../auth'
import type { Resource } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Parse and validate the resource ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid resource ID.',
      })
    }

    // Extract and validate the JWT token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = verificationResult.userId // Use userId from the token

    // Fetch the existing resource to ensure it exists
    const existingResource = await prisma.resource.findUnique({
      where: { id },
    })
    if (!existingResource) {
      throw createError({
        statusCode: 404,
        message: 'Resource not found.',
      })
    }

    // Parse the incoming request body as partial resource data
    const resourceData: Partial<Resource> = await readBody(event)

    // Check that the user is authorized to update the resource if needed
    if (existingResource.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this resource.',
      })
    }

    // Update the resource in the database
    const updatedResource = await prisma.resource.update({
      where: { id },
      data: resourceData,
    })

    return { success: true, resource: updatedResource }
  } catch (error: unknown) {
    return errorHandler({
      error,
      context: `Updating resource with ID ${id}`,
    })
  }
})
