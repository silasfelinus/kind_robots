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
  liked?: boolean
  hated?: boolean
  loved?: boolean
  flagged?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    // Read and validate the exchange data
    const exchangeData: ExchangeData = await readBody(event)

    // Validate required fields
    if (
      !exchangeData.userId
      || !exchangeData.botId
      || !exchangeData.botName
      || !exchangeData.username
      || !exchangeData.userPrompt
      || !exchangeData.botResponse
    ) {
      throw new Error('Invalid exchange data. Missing required fields.')
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
        liked: exchangeData.liked ?? false, // Default to false if not provided
        hated: exchangeData.hated ?? false, // Default to false if not provided
        loved: exchangeData.loved ?? false, // Default to false if not provided
        flagged: exchangeData.flagged ?? false, // Default to false if not provided
      },
    })

    return {
      success: true,
      newExchange,
    }
  }
  catch (error: unknown) {
    // Type guard to narrow down error type
    let message = 'An unknown error occurred.'
    if (error instanceof Error) {
      message = error.message
    }

    // Log the error for debugging
    console.error('Error in /server/api/chats/index.post.ts:', error)

    // Use custom error handling
    return errorHandler({
      success: false,
      message,
      statusCode: 500,
    })
  }
})
