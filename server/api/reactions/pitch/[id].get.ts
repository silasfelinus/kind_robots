import { defineEventHandler } from 'h3'
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

    // Fetch reactions associated with the given pitchId
    const reactions = await prisma.reaction.findMany({
      where: { pitchId },
      include: {
        User: true, // Include the User data if needed
      },
    })

    if (!reactions || reactions.length === 0) {
      return {
        success: false,
        message: `No reactions found for pitch with ID ${pitchId}.`,
        statusCode: 404,
      }
    }

    // Return the reactions
    return {
      success: true,
      reactions,
    }
  } catch (error) {
    console.error(
      `Error fetching reactions for pitch ID ${event.context.params?.id}:`,
      error,
    )
    // Use the errorHandler for consistent error handling
    return errorHandler({
      error,
      context: `Fetching reactions for pitch ID ${event.context.params?.id}`,
    })
  }
})
