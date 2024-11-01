import { defineEventHandler, createError, readBody } from 'h3'
import type { Art } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { verifyJwtToken } from '../auth'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Extract and validate Art ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Art ID. It must be a positive integer.',
      })
    }

    // Extract token from Authorization header
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

    // Check if the Art entry exists
    const artEntry = await prisma.art.findUnique({ where: { id } })
    if (!artEntry) {
      throw createError({
        statusCode: 404,
        message: `Art entry with ID ${id} does not exist.`,
      })
    }

    // Verify ownership
    if (artEntry.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this art entry.',
      })
    }

    // Validate and update Art data
    const updatedArtData: Partial<Art> = await readBody(event)
    if (!updatedArtData || Object.keys(updatedArtData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const updatedArt = await prisma.art.update({
      where: { id },
      data: updatedArtData,
    })

    return {
      success: true,
      updatedArt,
      statusCode: 200, // Explicit success status code for testing
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message || `Failed to update art entry with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
