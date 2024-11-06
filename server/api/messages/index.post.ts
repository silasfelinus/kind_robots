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

    // Successful creation response
    response = {
      success: true,
      message: 'Message created successfully.',
      data: newMessage, // Wrap the new message in a 'data' field
      statusCode: 201,
    }
    event.node.res.statusCode = 201
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
