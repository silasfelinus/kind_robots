import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Extract componentId from the route parameters
    const componentId = Number(event.context.params?.id)

    // Validate componentId
    if (isNaN(componentId) || componentId <= 0) {
      throw new Error('A valid component ID is required.')
    }

    // Fetch reactions associated with the given componentId
    const reactions = await prisma.reaction.findMany({
      where: { componentId },
      include: {
        User: true, // Use 'User' here to match your schema
      },
    })

    if (!reactions || reactions.length === 0) {
      return {
        success: false,
        message: `No reactions found for component with ID ${componentId}.`,
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
      `Error fetching reactions for component ID ${event.context.params?.id}:`,
      error,
    )
    // Use the errorHandler for consistent error handling
    return errorHandler({
      error,
      context: `Fetching reactions for component ID ${event.context.params?.id}`,
    })
  }
})
