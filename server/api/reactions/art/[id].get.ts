// server/api/reactions/art/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Extract artId from the route parameters
    const artId = Number(event.context.params?.id)

    // Validate artId
    if (isNaN(artId) || artId <= 0) {
      event.node.res.statusCode = 400
      throw new Error('A valid art ID is required.')
    }

    // Fetch reactions associated with the given artId
    const reactions = await prisma.reaction.findMany({
      where: { artId },
      include: {
        User: true, // Include user data if required
      },
    })

    if (!reactions || reactions.length === 0) {
      event.node.res.statusCode = 404
      return {
        success: false,
        data: {
          message: `No reactions found for art with ID ${artId}.`,
        },
      }
    }

    // Return the reactions within a data object
    return {
      success: true,
      data: { reactions },
    }
  } catch (error: unknown) {
    console.error(
      `Error fetching reactions for art ID ${event.context.params?.id}:`,
      error,
    )
    // Use the errorHandler for consistent error handling
    return errorHandler(error)
  }
})
