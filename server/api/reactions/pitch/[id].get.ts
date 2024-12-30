// server/api/reactions/pitch/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Extract pitchId from the route parameters
    const pitchId = Number(event.context.params?.id)

    // Validate pitchId
    if (isNaN(pitchId) || pitchId <= 0) {
      event.node.res.statusCode = 400
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
      event.node.res.statusCode = 404
      return {
        success: false,
        data: {
          message: `No reactions found for pitch with ID ${pitchId}.`,
        },
      }
    }

    // Return the reactions in the required format
    event.node.res.statusCode = 200
    return {
      success: true,
      data: { reactions },
    }
  } catch (error) {
    console.error(
      `Error fetching reactions for pitch ID ${event.context.params?.id}:`,
      error,
    )
    // Use the errorHandler for consistent error handling
    const handledError = errorHandler({
      error,
      context: `Fetching reactions for pitch ID ${event.context.params?.id}`,
    })
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      data: {
        message: handledError.message || 'Failed to retrieve reactions.',
      },
    }
  }
})
