// /server/api/chats/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let response

  try {
    const id = Number(event.context.params?.id)

    // Validate the chat exchange ID
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Chat Exchange ID. It must be a positive integer.',
      })
    }

    // Fetch the chat exchange
    const chatExchange = await prisma.chatExchange.findUnique({
      where: { id },
    })

    if (!chatExchange) {
      throw createError({
        statusCode: 404,
        message: `Chat exchange with ID ${id} does not exist.`,
      })
    }

    response = {
      success: true,
      data: {
        chatExchange,
      },
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    response = {
      success: false,
      message: handledError.message || 'Failed to retrieve chat exchange.',
      statusCode: handledError.statusCode || 500,
    }
    event.node.res.statusCode = response.statusCode
  }

  return response
})
