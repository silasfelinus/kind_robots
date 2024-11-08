// /server/api/resources/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Prisma, Resource } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let response

  try {
    // Validate authorization token
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

    const authenticatedUserId = user.id

    // Read and validate the request body
    const resourceData = await readBody<Partial<Resource>>(event)

    // Validate required fields
    if (!resourceData.name || typeof resourceData.name !== 'string') {
      throw createError({
        statusCode: 400,
        message: '"name" is a required field and must be a string.',
      })
    }

    // Exclude userId from the request input, as it’s handled by the authenticated user
    const { userId, ...resourceInput } = resourceData

    // Create the resource with a connection to the authenticated user
    const data = await prisma.resource.create({
      data: {
        ...resourceInput,
        User: { connect: { id: authenticatedUserId } },
      } as Prisma.ResourceCreateInput,
    })

    // Successful creation response
    event.node.res.statusCode = 201
    response = {
      success: true,
      message: 'Resource created successfully.',
      data,
      statusCode: 201,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to create a new resource.',
      data: null,
      statusCode: handledError.statusCode || 500,
    }
  }

  return response
})
