// /server/api/messages/user/[id].get.ts

import { defineEventHandler } from 'h3'
import type { ChatExchange } from '@prisma/client'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const userId = Number(event.context.params?.id)
    const messages = await fetchMessagesByUserId(userId)
    return { success: true, messages }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to fetch chat messages by User ID
export async function fetchMessagesByUserId(userId: number): Promise<ChatExchange[]> {
  return await prisma.chatExchange.findMany({
    where: {
      userId: userId
    },
    orderBy: {
      createdAt: 'desc'  // Assuming you want the most recent messages first
    }
  })
}
