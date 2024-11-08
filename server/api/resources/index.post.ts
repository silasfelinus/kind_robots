// /server/api/resources/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { validateApiKey } from '../utils/validateKey'
import type { Prisma, Resource } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Use validateApiKey for authentication
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      event.node.res.statusCode = 401 // Set HTTP status code to 401 Unauthorized
      return {
        success: false,
        message: 'Invalid or expired token.',
      }
    }

    const authenticatedUserId = user.id

    // Read and validate the request body
    const resourceData = await readBody<Partial<Resource>>(event)

    // Validate required "name" field
    if (!resourceData.name || typeof resourceData.name !== 'string') {
      throw createError({
        statusCode: 400,
        message: '"name" is a required field and must be a string.',
      })
    }

    // Exclude userId from request input, as it’s handled by the authenticated user
    const { userId, ...resourceInput } = resourceData

    // Create the resource with a connection to the authenticated user
    const data = await prisma.resource.create({
      data: {
        ...resourceInput,
        User: { connect: { id: authenticatedUserId } },
      } as Prisma.ResourceCreateInput,
    })

    // Return a success response
    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'Resource created successfully.',
      data,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to create a new resource.',
      data: null,
    }
  }
})
