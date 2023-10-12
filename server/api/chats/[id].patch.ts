// /server/api/chats/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const reactionData = await readBody(event)

    // Validate reactions
    if (
      typeof reactionData.liked !== 'boolean' ||
      typeof reactionData.hated !== 'boolean' ||
      typeof reactionData.loved !== 'boolean' ||
      typeof reactionData.flagged !== 'boolean'
    ) {
      throw new TypeError('Invalid reaction data.')
    }

    const updatedExchange = await prisma.chatExchange.update({
      where: { id },
      data: reactionData
    })

    return {
      success: true,
      updatedExchange
    }
  } catch (error: any) {
    return errorHandler({ success: false, message: error.message, statusCode: 500 })
  }
})
