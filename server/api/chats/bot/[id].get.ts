// /server/api/chats/bot/[id].get.ts
import { defineEventHandler } from 'h3'
import { ChatExchange } from '@prisma/client'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const botId = Number(event.context.params?.id)
    const botChats = await prisma.chatExchange.findMany({ where: { botId } })

    return {
      success: true,
      botChats
    }
  } catch (error: any) {
    return errorHandler(error)
  }
})
