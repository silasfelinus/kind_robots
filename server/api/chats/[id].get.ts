// /server/api/chats/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const chatExchanges = await prisma.chatExchange.findUnique({ where: { id } })

    return {
      success: true,
      chatExchanges
    }
  } catch (error: any) {
    return errorHandler(error)
  }
})
