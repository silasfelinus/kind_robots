// /server/api/chats/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const exchangeData = await readBody(event)

    // Validate data
    if (
      !exchangeData.botId ||
      !exchangeData.userId ||
      !exchangeData.userPrompt ||
      !exchangeData.botResponse
    ) {
      throw new Error('Invalid exchange data.')
    }

    const newExchange = await prisma.chatExchange.create({
      data: exchangeData
    })

    return {
      success: true,
      newExchange
    }
  } catch (error: any) {
    return errorHandler({ success: false, message: error.message, statusCode: 500 })
  }
})
