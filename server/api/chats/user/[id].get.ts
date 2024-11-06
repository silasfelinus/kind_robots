// /server/api/chats/user/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  let response

  try {
    const userId = Number(event.context.params?.id)
    if (isNaN(userId) || userId <= 0) {
      throw new Error('Invalid User ID.')
    }

    // Fetch chats for the given user
    const userChats = await prisma.chatExchange.findMany({ where: { userId } })
    console.log("User chats:", userChats)

    response = {
      success: true,
      data: {
        userChats,
      },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to retrieve user chats.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
