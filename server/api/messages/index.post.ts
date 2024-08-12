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
  }
  catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    return {
      success,
      message,
      statusCode,
    }
  }
})

// Function to create a new Message
export async function createMessage(message: Partial<Message>): Promise<Message> {
  try {
    if (!message.content) {
      throw new Error('No content, no message. Sorry McLuhan.')
    }
    else if (!message.sender || !message.recipient) {
      throw new Error('No sender or recipient. What am I supposed to do?')
    }
    else {
      return await prisma.message.create({
        data: {
          sender: message.sender,
          recipient: message.recipient,
          content: message.content,
          channelId: message.channelId || 1,
        },
      })
    }
  }
  catch (error: unknown) {
    throw errorHandler(error)
  }
}
