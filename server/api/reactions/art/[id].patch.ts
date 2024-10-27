import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Extract artId from the route parameters
    const artId = Number(event.context.params?.id)
    if (!artId) {
      throw new Error('Art ID is required.')
    }

    // Parse the request body to get the reaction updates
    const body = await readBody(event)
    const { reactionType, userId } = body // Ensure 'reactionType' and 'userId' are extracted

    // Ensure that both reactionType and userId are provided
    if (!reactionType || !userId) {
      throw new Error('Reaction type and User ID are required.')
    }

    // Check if the reaction already exists for this user and art
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        artId,
        userId,
      },
    })

    let updatedReaction

    if (existingReaction) {
      // If reaction exists, update it
      updatedReaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: {
          reactionType, // Use 'reactionType' to update
        },
      })
    } else {
      // If no reaction exists, create a new one
      updatedReaction = await prisma.reaction.create({
        data: {
          artId,
          userId,
          reactionType, // Use 'reactionType' to create
        },
      })
    }

    if (!updatedReaction) {
      throw new Error(
        `Failed to update/create reaction for art with ID ${artId}.`,
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
