import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Extract pitchId from the route parameters
    const pitchId = Number(event.context.params?.id)

    // Validate pitchId
    if (isNaN(pitchId) || pitchId <= 0) {
      throw new Error('A valid pitch ID is required.')
    }

    // Read the request body for updates
    const updates = await readBody(event)

    // Validate the updates (for example, check for a valid reactionType)
    if (!updates.reactionType) {
      throw new Error('A valid reaction type is required.')
    }

    // Fetch the existing reaction by the pitchId and userId (assuming userId comes from auth or the request body)
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        pitchId,
        userId: updates.userId, // You might need to get this from auth or request
      },
    })

    // If the reaction exists, update it, otherwise return an error
    if (existingReaction) {
      const updatedReaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: updates,
      })

      return {
        success: true,
        reaction: updatedReaction,
      }
    } else {
      return {
        success: false,
        message: `No reaction found for pitch with ID ${pitchId} and user ID ${updates.userId}.`,
        statusCode: 404,
      }
    }
  } catch (error) {
    console.error(
      `Error updating reaction for pitch ID ${event.context.params?.id}:`,
      error,
    )
    // Use the errorHandler for consistent error handling
    return errorHandler({
      error,
      context: `Updating reaction for pitch ID ${event.context.params?.id}`,
    })
  }
})
