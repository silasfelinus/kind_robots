// /server/api/chats/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const exchangeData = await readBody(event)

    // Validate data
    if (
      !exchangeData.userId ||
      !exchangeData.botId ||
      !exchangeData.botName ||
      !exchangeData.username ||
      !exchangeData.userPrompt ||
      !exchangeData.botResponse
    ) {
      throw new Error('Invalid exchange data. Missing required fields.')
    }

    // Additional data type validations can go here

    const newExchange = await prisma.chatExchange.create({
      data: {
        userId: exchangeData.userId,
        botId: exchangeData.botId,
        botName: exchangeData.botName,
        username: exchangeData.username,
        userPrompt: exchangeData.userPrompt,
        botResponse: exchangeData.botResponse,
        liked: exchangeData.liked,
        hated: exchangeData.hated,
        loved: exchangeData.loved,
        flagged: exchangeData.flagged
      }
    })

    return {
      success: true,
      newExchange
    }
  } catch (error: any) {
    // Log the error for debugging
    console.error('Error in /server/api/chats/index.post.ts:', error)

    return errorHandler({
      success: false,
      message: error.message || 'An unknown error occurred.',
      statusCode: 500
    })
  }
})
