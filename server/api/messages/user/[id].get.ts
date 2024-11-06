// /server/api/messages/user/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import type { ChatExchange } from '@prisma/client'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

// Define the event handler for fetching messages by user ID
export default defineEventHandler(async (event) => {
  let response

  try {
    // Ensure that userId is correctly retrieved and converted to a number
    const userId = Number(event.context.params?.id)

    // Check if userId is a valid number
    if (isNaN(userId) || userId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid user ID. It must be a positive integer.',
      })
    }

    // Fetch messages using the userId
    const messages = await fetchMessagesByUserId(userId)

    // Successful response with messages
    response = {
      success: true,
      message: 'Messages retrieved successfully.',
      data: { messages }, // Wrap messages in data field
    }
    event.node.res.statusCode = 200 // Set status code to 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error fetching messages:', handledError)

    // Set response based on the handled error
    response = {
      success: false,
      message: handledError.message || 'Failed to fetch messages.',
      statusCode: handledError.statusCode || 500,
    }
  }

  return response // Return the structured response
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
