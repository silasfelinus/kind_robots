//server/api/chats/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let response
  let id: number | null = null

  try {
    // Validate chat exchange ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid chat exchange ID.',
      })
    }

    // Extract and validate the JWT token
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

    // Read and validate reaction data as a partial Reaction model
    const reactionData = await readBody(event)
    if (!reactionData || Object.keys(reactionData).length === 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Validate presence of required fields in reactionData
    if (!reactionData.reactionType) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'reactionType is required.',
      })
    }

    // Ensure the user is authorized to modify this reaction
    if (reactionData.userId && reactionData.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this reaction.',
      })
    }

    // Check if the reaction already exists for the user and chat exchange
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        chatExchangeId: reactionData.chatExchangeId ?? id,
        userId: userId,
      },
    })

    // Update or create the reaction based on its existence
    const updatedReaction = await prisma.reaction.upsert({
      where: { id: existingReaction?.id ?? 0 },
      update: reactionData,
      create: {
        ...reactionData,
        userId: userId,
        chatExchangeId: reactionData.chatExchangeId ?? id,
      },
    })

    response = {
      success: true,
      updatedReaction,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(
      `Error updating reaction for chat exchange with id ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )

    // Set appropriate status code based on error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to update reaction for chat exchange with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
