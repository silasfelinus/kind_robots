import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Extract componentId from the route parameters
    const componentId = Number(event.context.params?.id)
    if (!componentId) {
      throw new Error('Component ID is required.')
    }

    // Fetch reactions associated with the given componentId
    const reactions = await prisma.reaction.findMany({
      where: { componentId },
      include: {
        User: true, // Include user data
      },
    })

    if (!reactions) {
      throw new Error(`No reactions found for component with ID ${componentId}.`)
    }

    return {
      success: true,
      reactions,
    }
  } catch (error: unknown) {
    // Use the errorHandler for consistent error handling
    return errorHandler(error)
  }
})
