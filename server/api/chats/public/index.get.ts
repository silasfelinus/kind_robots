// /server/api/chats/public/index.get.ts
import { defineEventHandler } from 'h3'
import type { ChatExchange } from '@prisma/client'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  let response

  try {
    const publicChatExchanges = await fetchPublicChatExchanges()
    response = {
      success: true,
      data: {
        chatExchanges: publicChatExchanges,
      },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to retrieve public chats.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

// Function to fetch all public Chat Exchanges
export async function fetchPublicChatExchanges(): Promise<ChatExchange[]> {
  return await prisma.chatExchange.findMany({
    where: {
      isPublic: true,
    },
  })
}
