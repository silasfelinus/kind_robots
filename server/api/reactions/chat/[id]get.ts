// /server/api/reactions/chat/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Extract chatExchangeId from the route parameters
    const chatExchangeId = Number(event.context.params?.id)

    // Validate chatExchangeId
    if (isNaN(chatExchangeId) || chatExchangeId <= 0) {
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
      return {
        success: false,
        message: `No reactions found for chat exchange with ID ${chatExchangeId}.`,
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
      `Error fetching reactions for chat exchange ID ${event.context.params?.id}:`,
      error,
    )
    // Use the errorHandler for consistent error handling
    return errorHandler({
      error,
      context: `Fetching reactions for chat exchange ID ${event.context.params?.id}`,
    })
  }
})
