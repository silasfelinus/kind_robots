// /server/api/resources/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Prisma, Resource } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Validate authorization token
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

    const authenticatedUserId = user.id

    // Read and validate the request body
    const resourceData = (await readBody(event)) as Partial<Resource>

    if (!resourceData.name) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Resource name is required.',
      })
    }

    // If userId is provided in resourceData, ensure it matches the authenticated user
    if (resourceData.userId && resourceData.userId !== authenticatedUserId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'User ID does not match the authenticated user.',
      })
    }

    // Create the resource with a connected User relation if userId is provided
    const newResource = await prisma.resource.create({
      data: {
        ...resourceData,
        User: { connect: { id: authenticatedUserId } }, // Ensure user relation is properly connected
      } as Prisma.ResourceCreateInput,
    })

    // Set status code to 201 Created
    event.node.res.statusCode = 201
    return { success: true, resource: newResource }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: 'Failed to create a new resource',
      error: message,
      statusCode: statusCode || 500,
    }
  }
})
