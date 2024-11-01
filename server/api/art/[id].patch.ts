import { defineEventHandler, createError, readBody } from 'h3'
import type { Art } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let response

  try {
    // Validate the Art ID
    const id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid Art ID. It must be a positive integer.',
      })
    }

    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1] // Extract token after "Bearer "
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

    const userId = user.id

    // Fetch the art entry and verify ownership
    const artEntry = await prisma.art.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!artEntry) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Art entry with ID ${id} does not exist.`,
      })
    }

    if (artEntry.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'User is not authorized to update this art entry.',
      })
    }

    // Retrieve and validate update data
    const updatedArtData: Partial<Art> = await readBody(event)
    if (!updatedArtData || Object.keys(updatedArtData).length === 0) {
      event.node.res.statusCode = 400
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

    // Successful update response
    response = {
      success: true,
      updatedArt,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.log('Error Handled:', handledError)

    // Explicitly set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to update art entry with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
