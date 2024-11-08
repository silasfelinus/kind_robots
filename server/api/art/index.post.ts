// /server/api/art/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import prisma from '../utils/prisma'
import type { Prisma, Art } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Use validateApiKey to authenticate
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
    if (!artData.promptString || typeof artData.promptString !== 'string') {
      event.node.res.statusCode = 400 // Bad Request
      return {
        success: false,
        message: '"promptString" is a required field and must be a string.',
      }
    }

    // Set authenticated user ID
    artData.userId = authenticatedUserId

    // Create the art entry
    const data = await prisma.art.create({
      data: artData as Prisma.ArtCreateInput,
    })

    // Return success response with 201 status code
    event.node.res.statusCode = 201
    return {
      success: true,
      data,
      message: 'Art created successfully.',
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: 'Failed to create a new art object.',
      error: message || 'An unknown error occurred',
    }
  }
})
