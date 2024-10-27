//server/api/reactions/art/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Extract artId from the route parameters
    const artId = Number(event.context.params?.id)

    // Validate artId
    if (isNaN(artId) || artId <= 0) {
      throw new Error('A valid art ID is required.')
    }

    // Fetch reactions associated with the given artId
    const reactions = await prisma.reaction.findMany({
      where: { artId }, // Adjust for the art-specific field
      include: {
        User: true, // Include user data if required
      },
    })

    if (!reactions || reactions.length === 0) {
      return {
        success: false,
        message: `No reactions found for art with ID ${artId}.`,
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
      `Error fetching reactions for art ID ${event.context.params?.id}:`,
      error,
    )
    // Use the errorHandler for consistent error handling
    return errorHandler({
      error,
      context: `Fetching reactions for art ID ${event.context.params?.id}`,
    })
  }
})
