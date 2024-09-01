// /server/api/messages/user/[id].get.ts
import { defineEventHandler } from 'h3'
import type { ChatExchange } from '@prisma/client'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Ensure that userId is correctly retrieved and converted to a number
    const userId = Number(event.context.params?.id)

    // Check if userId is a valid number
    if (isNaN(userId)) {
      throw new Error('Invalid user ID')
    }

    // Fetch messages using the userId
    const messages = await fetchMessagesByUserId(userId)
    return { success: true, messages }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to fetch chat messages by User ID
export async function fetchMessagesByUserId(
  userId: number,
): Promise<ChatExchange[]> {
  // Use the userId directly in the Prisma query
  return await prisma.chatExchange.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: 'desc', // Fetch the most recent messages first
    },
  })
}
