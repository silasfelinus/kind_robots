// /server/api/messages/index.post.ts
import type { Message } from '@prisma/client'
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response

  try {
    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Read the message data from the request body
    const messageData: Partial<Message> = await readBody(event)

    // Check for required fields and throw an error if missing
    if (!messageData.sender || !messageData.recipient || !messageData.content) {
      throw createError({
        statusCode: 400,
        message: 'Sender, recipient, and content are required for a message.',
      })
    }

    // Verify that the provided userId (if any) matches the authenticated userId
    if (messageData.userId && messageData.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'User ID mismatch.',
      })
    }

    // Prepare the message data for creation
    const newMessageData = {
      sender: messageData.sender,
      recipient: messageData.recipient,
      content: messageData.content,
      channelId: messageData.channelId ?? 1, // Default to channel 1 if not provided
      botId: messageData.botId ?? null, // Set botId if available, otherwise null
      userId: userId, // Use the authenticated user's ID
    }

    // Create the new message
    const newMessage = await prisma.message.create({
      data: newMessageData,
    })

    // Set status code to 201 Created
    event.node.res.statusCode = 201
    response = { success: true, newMessage, statusCode: 201 }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to create message.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
