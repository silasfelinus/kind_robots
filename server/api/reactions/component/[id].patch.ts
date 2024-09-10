import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma' // No need to import ReactionType as it's not a separate enum in Prisma's client

export default defineEventHandler(async (event) => {
  try {
    // Extract componentId from the route parameters
    const componentId = Number(event.context.params?.id)
    if (!componentId) {
      throw new Error('Component ID is required.')
    }

    // Parse the request body to get the reaction updates
    const body = await readBody(event)
    const { reaction, userId } = body // Ensure 'reaction' is used, not 'reactionType'

    // Ensure that both reaction and userId are provided
    if (!reaction || !userId) {
      throw new Error('Reaction and User ID are required.')
    }

    // Check if the reaction already exists for this user and component
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        componentId,
        userId,
      },
    })

    let updatedReaction

    if (existingReaction) {
      // If reaction exists, update it
      updatedReaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: {
          reaction, // Use 'reaction' here, not 'reactionType'
        },
      })
    } else {
      // If no reaction exists, create a new one
      updatedReaction = await prisma.reaction.create({
        data: {
          componentId,
          userId,
          reaction, // Use 'reaction' here, not 'reactionType'
        },
      })
    }

    if (!updatedReaction) {
      throw new Error(
        `Failed to update/create reaction for component with ID ${componentId}.`,
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
