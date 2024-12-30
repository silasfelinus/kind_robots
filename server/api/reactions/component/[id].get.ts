// /server/api/reactions/component/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  let componentId
  try {
    // Extract componentId from the route parameters
    componentId = Number(event.context.params?.id)

    // Validate componentId
    if (isNaN(componentId) || componentId <= 0) {
      event.node.res.statusCode = 400
      throw new Error('A valid component ID is required.')
    }

    // Fetch reactions associated with the given componentId
    const data = await prisma.reaction.findMany({
      where: { componentId },
      include: {
        User: true, // Include user data associated with the reaction
      },
    })

    if (!data || data.length === 0) {
      event.node.res.statusCode = 404
      return {
        success: false,
        data: {
          message: `No reactions found for component with ID ${componentId}.`,
        },
      }
    }

    // Return the reactions wrapped in a data object
    event.node.res.statusCode = 200
    return {
      success: true,
      data,
    }
  } catch (error: unknown) {
    console.error(
      `Error fetching reactions for component ID ${event.context.params?.id}:`,
      error,
    )
    // Standardized error handling with errorHandler
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      data: {
        message:
          handledError.message ||
          `Failed to retrieve reactions for component with ID ${componentId}.`,
      },
    }
  }
})
