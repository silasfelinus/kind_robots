// /server/api/art/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import prisma from '../utils/prisma'
import type { Prisma, Art } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Authenticate the user
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id
    const artData = await readBody<Partial<Art>>(event)

    // Validate required "promptString" field
    if (!artData.promptString) {
      event.node.res.statusCode = 400
      return {
        success: false,
        message: '"promptString" is a required field.',
      }
    }

    artData.userId = authenticatedUserId

    // Attempt to create the art entry in the database
    const data = await prisma.art.create({
      data: artData as Prisma.ArtCreateInput,
    })

    // Set status code to 201 for successful creation
    event.node.res.statusCode = 201
    return {
      success: true,
      data,
      message: 'Art created successfully',
    }
  } catch (error) {
    // Use the error handler to process the error
    const { message, statusCode } = errorHandler(error)

    // Set status code for error responses
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      data: null,
      message: 'Failed to create a new art object',
      error: message || 'An unknown error occurred',
    }
  }
})
