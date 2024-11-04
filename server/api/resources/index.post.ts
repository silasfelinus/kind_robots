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
    const resourceData = await readBody<Partial<Resource>>(event)

    // Validate required fields
    if (!resourceData.name || typeof resourceData.name !== 'string') {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: '"name" is a required field and must be a string.',
      })
    }

    // Prepare the data object for the new resource, removing userId if it exists in resourceData
    const { userId, ...resourceInput } = resourceData // Exclude userId from input data

    // Create the resource with the connected authenticated user
    const newResource = await prisma.resource.create({
      data: {
        ...resourceInput,
        User: { connect: { id: authenticatedUserId } }, // Connect authenticated user
      } as Prisma.ResourceCreateInput,
    })

    // Set status code to 201 Created for successful creation
    event.node.res.statusCode = 201
    return { success: true, resource: newResource }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message.includes('token')
        ? message
        : 'Failed to create a new resource',
      error: message,
      statusCode: statusCode || 500,
    }
  }
})
