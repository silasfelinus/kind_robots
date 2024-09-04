// /server/api/messages/index.post.ts
import type { Message } from '@prisma/client'
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Read the message data from the request body
    const messageData: Partial<Message> = await readBody(event)

    // Create a new message
    const newMessage = await createMessage(messageData)

    return { success: true, newMessage }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    return {
      success,
      message,
      statusCode,
    }
  }
})

// Function to create a new Message
export async function createMessage(
  message: Partial<Message>,
): Promise<Message> {
  try {
    // Validation checks
    if (!message.content) {
      throw new Error('No content, no message. Sorry McLuhan.')
    }

    if (!message.sender || !message.recipient) {
      throw new Error('No sender or recipient. What am I supposed to do?')
    }

    // Prepare message data for creation
    const newMessageData = {
      sender: message.sender,
      recipient: message.recipient,
      content: message.content,
      channelId: message.channelId || 1,  // Default to channel 1 if not provided
      botId: message.botId || null,  // Set botId if available, otherwise null
      userId: message.userId || null  // Set userId if available, otherwise null
    }

    // Create and return the new message
    return await prisma.message.create({
      data: newMessageData,
    })
  } catch (error: unknown) {
    throw errorHandler(error)  // Pass the error through error handler
  }
}
