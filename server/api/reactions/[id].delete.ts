// /server/api/reactions/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let reactionId

  try {
    // Validate and parse the reaction ID
    reactionId = Number(event.context.params?.id)
    if (isNaN(reactionId) || reactionId <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid reaction ID. It must be a positive integer.',
      })
    }

    console.log(`Attempting to delete reaction with ID: ${reactionId}`)

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

    const userId = user.id

    // Check if the reaction exists and if the user is authorized to delete it
    const reaction = await prisma.reaction.findUnique({
      where: { id: reactionId },
      select: { userId: true },
    })

    if (!reaction) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Reaction with ID ${reactionId} does not exist.`,
      })
    }

    if (reaction.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this reaction.',
      })
    }

    // Delete the reaction
    await prisma.reaction.delete({
      where: { id: reactionId },
    })

    console.log(`Successfully deleted reaction with ID: ${reactionId}`)

    // Successful deletion response
    response = {
      success: true,
      message: `Reaction with ID ${reactionId} successfully deleted.`,
      data: {},
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error deleting reaction:', handledError)

    // Explicitly set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      data: {
        message:
          handledError.message ||
          `Failed to delete reaction with ID ${reactionId}.`,
      },
    }
  }

  return response
})
