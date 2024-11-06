// server/api/chats/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let id: number | null = null

  try {
    // Validate and parse the chat exchange ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Chat Exchange ID. It must be a positive integer.',
      })
    }

    // Extract and verify the API key from the Authorization header
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401, // Unauthorized
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
        statusCode: 401, // Unauthorized
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Check if the chat exchange exists and verify ownership
    const chatExchange = await prisma.chatExchange.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!chatExchange) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Chat exchange with ID ${id} does not exist.`,
      })
    }

    if (chatExchange.userId !== userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You do not have permission to delete this chat exchange.',
      })
    }

    // Delete the chat exchange
    await prisma.chatExchange.delete({ where: { id } })

    // Set the success response
    response = {
      success: true,
      data: {
        message: `Chat exchange with ID ${id} successfully deleted.`,
      },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    response = {
      success: false,
      message:
        handledError.message || `Failed to delete chat exchange with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
    event.node.res.statusCode = response.statusCode
  }

  return response
})
