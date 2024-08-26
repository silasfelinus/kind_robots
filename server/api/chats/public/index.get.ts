//server/api/chats/public/index.get.ts
import { defineEventHandler } from 'h3'
import type { ChatExchange } from '@prisma/client'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const publicChatExchanges = await fetchPublicChatExchanges()
    return { success: true, chatExchanges: publicChatExchanges }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to fetch all public Chat Exchanges
export async function fetchPublicChatExchanges(): Promise<ChatExchange[]> {
  return await prisma.chatExchange.findMany({
    where: {
      isPublic: true,
    },
  })
}
