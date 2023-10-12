// /server/api/chats/bot/[id].get.ts
import { defineEventHandler } from 'h3'
import { ChatExchange } from '@prisma/client'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const userId = Number(event.context.params?.id)
    const userChats = await prisma.chatExchange.findMany({ where: { userId } })

    return {
      success: true,
      userChats
    }
  } catch (error: any) {
    return errorHandler(error)
  }
})
