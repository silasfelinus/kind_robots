import { defineEventHandler } from 'h3'
import type { Message } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async () => {
  let response

  try {
    const messages = await fetchAllMessages()

    // Return a structured response with success, messages, and status code
    response = {
      success: true,
      message: 'Messages fetched successfully.',
      data: messages, // Wrap the messages in a 'data' field for consistency
      statusCode: 200,
    }
  } catch (error: unknown) {
    // Handle errors with the centralized error handler
    const handledError = errorHandler(error)
    console.error('Error fetching messages:', handledError)

    response = {
      success: false,
      message: handledError.message || 'Failed to fetch messages.',
      statusCode: handledError.statusCode || 500,
    }
  }

  return response
})

// Function to fetch all Messages
export async function fetchAllMessages(): Promise<Message[]> {
  return await prisma.message.findMany()
}
