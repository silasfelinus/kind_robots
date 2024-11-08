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
      return {
        success: false,
        message: '"promptString" is a required field.',
        statusCode: 400, // Bad Request
      }
    }

    // Add the authenticated user's ID to the data object
    const data: Prisma.ArtCreateInput = {
      ...artData,
      userId: authenticatedUserId,
    } as Prisma.ArtCreateInput

    // Attempt to create the art entry in the database
    const createdArt = await prisma.art.create({ data })

    // Return success response
    return {
      success: true,
      art: createdArt,
    }
  } catch (error) {
    // Use the error handler to process the error
    const { message, statusCode } = errorHandler(error)

    // Return the error response with the processed message and status code
    return {
      success: false,
      message: 'Failed to create a new art object',
      error: message || 'An unknown error occurred',
      statusCode: statusCode || 500, // Default to 500 if no status code is provided
    }
  }
})
