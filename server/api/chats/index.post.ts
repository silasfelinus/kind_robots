// /server/api/chats/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

// Define a TypeScript interface for the expected exchange data
interface ExchangeData {
  userId: number
  botId: number
  botName: string
  username: string
  userPrompt: string
  botResponse: string
  previousEntryId: number
}

export default defineEventHandler(async (event) => {
  try {
    // Read and validate the exchange data
    const exchangeData: ExchangeData = await readBody(event)

    // Validate required fields
    if (
      !exchangeData.botId ||
      !exchangeData.botName ||
      !exchangeData.username ||
      !exchangeData.userPrompt ||
      !exchangeData.botResponse
    ) {
      return errorHandler({
        success: false,
        message: 'Invalid exchange data. Missing required fields.',
        statusCode: 400, // Bad request
      })
    }

    // Optional: Check if the user and bot exist in the database
    const user = exchangeData.userId
      ? await prisma.user.findUnique({ where: { id: exchangeData.userId } })
      : null

    const bot = await prisma.bot.findUnique({
      where: { id: exchangeData.botId },
    })

    if (exchangeData.userId && !user) {
      return errorHandler({
        success: false,
        message: `User with id ${exchangeData.userId} does not exist.`,
        statusCode: 404, // Not found
      })
    }

    if (!bot) {
      return errorHandler({
        success: false,
        message: `Bot with id ${exchangeData.botId} does not exist.`,
        statusCode: 404, // Not found
      })
    }

    // Create the new chat exchange
    const newExchange = await prisma.chatExchange.create({
      data: {
        userId: exchangeData.userId,
        botId: exchangeData.botId,
        botName: exchangeData.botName,
        username: exchangeData.username,
        userPrompt: exchangeData.userPrompt,
        botResponse: exchangeData.botResponse,
        previousEntryId: exchangeData.previousEntryId,
      },
    })

    return {
      success: true,
      newExchange,
    }
  } catch (error: unknown) {
    let message = 'An unknown error occurred.'
    let statusCode = 500 // Internal server error by default

    if (error instanceof Error) {
      // Prisma-specific error handling (if any)
      if (error.name === 'PrismaClientKnownRequestError') {
        message = `Database error: ${error.message}`
        statusCode = 500
      } else {
        message = error.message
      }
    }

    // Log the error for further investigation
    console.error('Error in /server/api/chats/index.post.ts:', error)

    // Use custom error handling with improved message and status code
    return errorHandler({
      success: false,
      message,
      statusCode,
    })
  }
})
