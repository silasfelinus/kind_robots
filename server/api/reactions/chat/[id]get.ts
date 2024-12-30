// /server/api/reactions/chat/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  let chatId
  try {
    // Extract chatId from the route parameters
    chatId = Number(event.context.params?.id)

    // Validate chatId
    if (isNaN(chatId) || chatId <= 0) {
      event.node.res.statusCode = 400
      throw new Error('A valid chat ID is required.')
    }

    // Fetch reactions associated with the given chatId
    const reactions = await prisma.reaction.findMany({
      where: { chatId },
      include: {
        User: true, // Include the user who reacted
      },
    })

    if (!reactions || reactions.length === 0) {
      event.node.res.statusCode = 404
      return {
        success: false,
        data: {
          message: `No reactions found for chat exchange with ID ${chatId}.`,
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
          `Failed to retrieve reactions for chat exchange with ID ${chatId}.`,
      },
    }
  }
})
