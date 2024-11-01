//server/api/chats/[id].patch.ts
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
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid chat ID.',
      })
    }

    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader) {
      console.error('Authorization header is missing.')
      throw createError({
        statusCode: 401,
        message: 'Authorization header is missing.',
      })
    }
    if (!authorizationHeader.startsWith('Bearer ')) {
      console.error('Authorization token format is incorrect.')
      throw createError({
        statusCode: 401,
        message: 'Authorization token format is incorrect.',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      console.error(`Invalid or expired token: ${token}`)
      event.node.res.statusCode = 401
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
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Chat with ID ${chatId} not found.`,
      })
    }

    if (chat.userId !== userIdFromToken) {
      console.error(
        `User ID mismatch. Token user ID: ${userIdFromToken}, Chat owner ID: ${chat.userId}`,
      )
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this chat.',
      })
    }

    // Parse and validate the update data
    const updatedChatData = await readBody(event)
    if (!updatedChatData || Object.keys(updatedChatData).length === 0) {
      console.error('No data provided for update.')
      event.node.res.statusCode = 400
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
      updatedChat,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    console.error(`Failed to update chat with ID "${chatId}":`, handledError)

    // Set the appropriate status code based on the handled error
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
