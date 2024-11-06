// /server/api/reactions/chat/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  let chatExchangeId
  try {
    // Extract chatExchangeId from the route parameters
    chatExchangeId = Number(event.context.params?.id)

    // Validate chatExchangeId
    if (isNaN(chatExchangeId) || chatExchangeId <= 0) {
      event.node.res.statusCode = 400
      throw new Error('A valid ChatExchange ID is required.')
    }

    // Fetch reactions associated with the given chatExchangeId
    const reactions = await prisma.reaction.findMany({
      where: { chatExchangeId },
      include: {
        User: true, // Include the user who reacted
      },
    })

    if (!reactions || reactions.length === 0) {
      event.node.res.statusCode = 404
      return {
        success: false,
        data: {
          message: `No reactions found for chat exchange with ID ${chatExchangeId}.`,
        },
      }
    }

    // Return the reactions in a data object
    event.node.res.statusCode = 200
    return {
      success: true,
      data: { reactions },
    }
  } catch (error: unknown) {
    console.error(
      `Error fetching reactions for chat exchange ID ${event.context.params?.id}:`,
      error,
    )
    // Consistent error handling with errorHandler
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      data: {
        message:
          handledError.message ||
          `Failed to retrieve reactions for chat exchange with ID ${chatExchangeId}.`,
      },
    }
  }
})
