//server/api/art/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import type { Art } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { authorizeUserForArtEntry } from '.'
import { extractTokenFromHeader, getUserIdFromToken } from '../auth'

export default defineEventHandler(async (event) => {
  let id
  try {
    // Validate Art ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Art ID. It must be a positive integer.',
      })
    }

    // Extract and verify authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    const token = extractTokenFromHeader(authorizationHeader)
    if (!token) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    // Get userId from token
    const userId = await getUserIdFromToken(token)
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // Authorize user for the art entry
    await authorizeUserForArtEntry(userId, id)

    // Retrieve update data and validate
    const updatedArtData: Partial<Art> = await readBody(event)
    if (!updatedArtData || Object.keys(updatedArtData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the art entry in the database
    const updatedArt = await prisma.art.update({
      where: { id },
      data: updatedArtData,
    })

    return {
      success: true,
      updatedArt,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.log('Error Handled:', handledError)

    return {
      success: false,
      message:
        handledError.message || `Failed to update art entry with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
