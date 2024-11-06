// server/api/chats/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let response
  let chatId: number | null = null

  try {
    // Parse and validate the Chat ID from the URL params
    chatId = Number(event.context.params?.id)
    if (isNaN(chatId) || chatId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid chat ID.',
      })
    }

    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Authorization token is required in the format "Bearer <token>".',
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

    const userIdFromToken = user.id

    // Fetch the chat entry to ensure it exists and verify ownership
    const chat = await prisma.chatExchange.findUnique({
      where: { id: chatId },
    })

    if (!chat) {
      throw createError({
        statusCode: 404,
        message: `Chat with ID ${chatId} not found.`,
      })
    }

    if (chat.userId !== userIdFromToken) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this chat.',
      })
    }

    // Parse and validate the update data
    const updatedChatData = await readBody(event)
    if (!updatedChatData || Object.keys(updatedChatData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the chat entry with validated data
    const updatedChat = await prisma.chatExchange.update({
      where: { id: chatId },
      data: updatedChatData,
    })

    // Successful update response
    response = {
      success: true,
      data: {
        updatedChat,
      },
      message: `Chat with ID ${chatId} updated successfully.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to update chat with ID ${chatId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
