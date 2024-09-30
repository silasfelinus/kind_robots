// /server/api/reactions/chat/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Extract chatExchangeId from the route parameters
    const chatExchangeId = Number(event.context.params?.id)
    if (!chatExchangeId) {
      throw new Error('ChatExchange ID is required.')
    }

    // Parse the request body to get the reaction updates
    const body = await readBody(event)
    const { reactionType, userId, comment } = body

    // Ensure that both reactionType and userId are provided
    if (!reactionType || !userId) {
      throw new Error('Reaction type and User ID are required.')
    }

    // Check if the reaction already exists for this user and chat exchange
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        chatExchangeId,
        userId,
      },
    })

    let updatedReaction

    if (existingReaction) {
      // If reaction exists, update it
      updatedReaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: {
          reactionType,
          comment: comment ?? existingReaction.comment,
        },
      })
    } else {
      // If no reaction exists, create a new one
      updatedReaction = await prisma.reaction.create({
        data: {
          chatExchangeId,
          userId,
          reactionType,
          comment: comment ?? '',
        },
      })
    }

    if (!updatedReaction) {
      throw new Error(
        `Failed to update/create reaction for chat exchange with ID ${chatExchangeId}.`,
      )
    }

    return {
      success: true,
      updatedReaction,
    }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
