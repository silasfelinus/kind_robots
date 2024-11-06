// /server/api/chats/index.get.ts
import { defineEventHandler } from 'h3'
import type { ChatExchange } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async () => {
  let response

  try {
    const chatExchanges = await fetchAllChatExchanges()
    response = {
      success: true,
      data: {
        chatExchanges,
      },
      message: 'Chat exchanges retrieved successfully.',
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    response = {
      success: false,
      message: handledError.message || 'Failed to retrieve chat exchanges.',
      statusCode: handledError.statusCode || 500,
    }
  }

  return response
})

// Function to fetch all Chat Exchanges
export async function fetchAllChatExchanges(): Promise<ChatExchange[]> {
  return await prisma.chatExchange.findMany()
}
