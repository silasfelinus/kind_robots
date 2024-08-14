// server/api/chats/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

type ReactionData = {
  liked?: boolean
  hated?: boolean
  loved?: boolean
  flagged?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    // Extract and validate ID
    const id = Number(event.context.params?.id)
    if (isNaN(id)) {
      throw new TypeError('Invalid ID.')
    }

    // Read and validate reaction data
    const reactionData: ReactionData = await readBody(event)
    const validReactions: Array<keyof ReactionData> = [
      'liked',
      'hated',
      'loved',
      'flagged',
    ]

    // Ensure all keys are valid and values are boolean
    for (const key of Object.keys(reactionData) as Array<keyof ReactionData>) {
      if (
        !validReactions.includes(key) ||
        typeof reactionData[key] !== 'boolean'
      ) {
        throw new TypeError('Invalid reaction data.')
      }
    }

    // Update chat exchange
    const updatedExchange = await prisma.chatExchange.update({
      where: { id },
      data: reactionData,
    })

    return {
      success: true,
      updatedExchange,
    }
  } catch (error: unknown) {
    console.error(
      `Error while updating chat exchange with id ${event.context.params?.id}:`,
      error,
    )
    const { success, message, statusCode } = errorHandler(error)
    return {
      success,
      message,
      statusCode: statusCode || 500,
    }
  }
})
