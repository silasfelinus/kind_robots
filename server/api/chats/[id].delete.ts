// /server/api/chats/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { validateApiKey } from '../utils/validateKey'

export default defineEventHandler(async (event) => {
  let response

  try {
    // Validate and parse the chat exchange ID
    const id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Chat Exchange ID. It must be a positive integer.',
      })
    }

    // Validate the API key using the utility function
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
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
        statusCode: 404,
        message: `Chat exchange with ID ${id} does not exist.`,
      })
    }

    if (chatExchange.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this chat exchange.',
      })
    }

    // Delete the chat exchange
    await prisma.chatExchange.delete({ where: { id } })

    // Set the success response with the correct message format
    response = {
      success: true,
      message: `Chat exchange with ID ${id} successfully deleted.`,
      data: {},
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to delete chat exchange with ID ${event.context.params?.id}.`,
      data: {},
      statusCode: handledError.statusCode || 500,
    }
    event.node.res.statusCode = response.statusCode
  }

  return response
})
