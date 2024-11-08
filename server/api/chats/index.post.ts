// /server/api/chats/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Prisma, Chat } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Validate the API key
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
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
    // Process the error with the error handler
    const { message, statusCode } = errorHandler(error)

    // Set status code for error responses
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      data: null,
      message: 'Failed to create chat entry.',
      error: message || 'An unknown error occurred',
    }
  }
})
