// /server/api/chats/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import type { Chat } from '@prisma/client'

type ChatResponse = {
  success: boolean
  message?: string
  data?: Chat
  statusCode?: number
}

export default defineEventHandler(async (event): Promise<ChatResponse> => {
  let response: ChatResponse
  const id = Number(event.context.params?.id)

  if (isNaN(id) || id <= 0) {
    return errorHandler({
      error: new Error('Invalid Chat ID. It must be a positive integer.'),
      context: 'Fetch Single Chat',
      statusCode: 400,
    })
  }

  try {
    // Fetch the chat by ID
    const chat = await prisma.chat.findUnique({ where: { id } })

    if (!chat) {
      return errorHandler({
        error: new Error(`Chat with ID ${id} not found.`),
        context: 'Fetch Single Chat',
        statusCode: 404,
      })
    }

    // Return success response with chat data
    response = {
      success: true,
      data: chat,
      message: 'Chat fetched successfully.',
      statusCode: 200,
    }
  } catch (error) {
    const handledError = errorHandler({
      error,
      context: 'Fetch Single Chat',
    })

    // Return standardized error response
    response = {
      success: false,
      message: handledError.message || `Failed to fetch chat with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }

  return response
})
