// /server/api/chats/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Prisma, Chat } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Validate the API key
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      event.node.res.statusCode = 401
      return {
        success: false,
        message: 'Authorization token is required or invalid.',
      }
    }

    const authenticatedUserId = user.id
    const chatData = await readBody<Partial<Chat>>(event)

    // Check for required fields
    if (!chatData.type || !chatData.sender || !chatData.content) {
      event.node.res.statusCode = 400
      return {
        success: false,
        message: 'Missing required fields: "type", "sender", "content".',
      }
    }

    // Add authenticated user ID to chat data
    chatData.userId = authenticatedUserId

    // Create the chat entry
    const data = await prisma.chat.create({
      data: chatData as Prisma.ChatCreateInput,
    })

    // Set status code to 201 for successful creation
    event.node.res.statusCode = 201
    return {
      success: true,
      data,
      message: 'Chat created successfully.',
    }
  } catch (error) {
    // Use the error handler only for unexpected errors
    const { message, statusCode } = errorHandler(error)

    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      data: null,
      message: message || 'Failed to create chat entry due to a server error.',
    }
  }
})
