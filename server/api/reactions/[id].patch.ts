// server/api/reactions/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let reactionId: number | null = null
  let response

  try {
    // Parse and validate the reaction ID from the URL params
    reactionId = Number(event.context.params?.id)
    if (isNaN(reactionId) || reactionId <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Missing or invalid reaction ID.',
      })
    }

    // Extract and validate the API key from the Authorization header
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

    const userId = user.id // Use userId from the validated token

    // Read and parse the request body as partial Reaction data
    const requestData: Partial<Reaction> = await readBody(event)
    const { reactionType, reactionCategory } = requestData

    // Ensure required fields are provided if necessary
    if (!reactionType || !reactionCategory) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Reaction type and category are required.',
      })
    }

    // Fetch the existing reaction to ensure it exists and verify ownership
    const existingReaction = await prisma.reaction.findUnique({
      where: { id: reactionId },
    })

    if (!existingReaction) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: 'Reaction not found.',
      })
    }

    if (existingReaction.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this reaction.',
      })
    }

    // Update the reaction in the database
    const updatedReaction = await prisma.reaction.update({
      where: { id: reactionId },
      data: requestData,
    })

    response = {
      success: true,
      reaction: updatedReaction,
      message: 'Reaction updated successfully',
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to update reaction with ID ${reactionId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
