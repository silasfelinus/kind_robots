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
  previousEntryId?: number
  promptId?: number
  isPublic?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    // Read and validate the exchange data
    const exchangeData: ExchangeData = await readBody(event)

    // Check required fields against schema
    const requiredFields = ['userId', 'botId', 'botName', 'username', 'userPrompt', 'botResponse']
    const missingFields = requiredFields.filter(field => !exchangeData[field as keyof ExchangeData])

    if (missingFields.length > 0) {
      return errorHandler({
        success: false,
        message: `Invalid exchange data. Missing required fields: ${missingFields.join(', ')}`,
        statusCode: 400,
      })
    }

    // Optional: Verify that `userId` and `botId` exist in the database
    const user = await prisma.user.findUnique({
      where: { id: exchangeData.userId }
    })
    const bot = await prisma.bot.findUnique({
      where: { id: exchangeData.botId }
    })

    if (!user) {
      return errorHandler({
        success: false,
        message: `User with id ${exchangeData.userId} does not exist.`,
        statusCode: 404
      })
    }
    
    if (!bot) {
      return errorHandler({
        success: false,
        message: `Bot with id ${exchangeData.botId} does not exist.`,
        statusCode: 404
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
        previousEntryId: exchangeData.previousEntryId ?? null,
        promptId: exchangeData.promptId ?? null,
        isPublic: exchangeData.isPublic ?? false
      }
    })

    return {
      success: true,
      newExchange,
    }
  } catch (error: unknown) {
    let message = 'An unknown error occurred.'
    let statusCode = 500 // Internal server error by default

    if (error instanceof Error) {
      if (error.name === 'PrismaClientKnownRequestError') {
        message = `Database error: ${error.message}`
      } else {
        message = error.message
      }
    }

    // Log error for detailed analysis
    console.error('Error in /server/api/chats/index.post.ts:', error)

    // Return structured error response
    return errorHandler({
      success: false,
      message,
      statusCode
    })
  }
})
