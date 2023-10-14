// /server/api/chats/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const reactionData = await readBody(event)

    // Validate reactions
    const validReactions = ['liked', 'hated', 'loved', 'flagged']
    for (const key in reactionData) {
      if (!validReactions.includes(key) || typeof reactionData[key] !== 'boolean') {
        throw new TypeError('Invalid reaction data.')
      }
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
    console.error(`Error while updating chat exchange with id ${event.context.params?.id}:`, error)
    return errorHandler({
      success: false,
      message: error.message || 'An unknown error occurred.',
      statusCode: 500
    })
  }
})
