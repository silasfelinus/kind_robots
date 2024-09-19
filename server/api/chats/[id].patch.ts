// server/api/chats/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

type ReactionData = {
  reactionType: 'LOVED' | 'CLAPPED' | 'BOOED' | 'HATED' | 'NEUTRAL' | 'FLAGGED'
  comment?: string
  userId: number
  artId?: number
  pitchId?: number
  componentId?: number
  channelId?: number
  chatExchangeId?: number
  reactionCategory: 'ART' | 'PITCH' | 'COMPONENT' | 'CHANNEL' | 'TITLE'
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
    
    // Validate reactionType and reactionCategory
    const validReactionTypes = ['LOVED', 'CLAPPED', 'BOOED', 'HATED', 'NEUTRAL', 'FLAGGED']
    const validReactionCategories = ['ART', 'PITCH', 'COMPONENT', 'CHANNEL', 'TITLE']

    if (!validReactionTypes.includes(reactionData.reactionType)) {
      throw new TypeError('Invalid reaction type.')
    }

    if (!validReactionCategories.includes(reactionData.reactionCategory)) {
      throw new TypeError('Invalid reaction category.')
    }

    // Adjusting the Prisma where clause
const existingReaction = await prisma.reaction.findFirst({
  where: {
    chatExchangeId: reactionData.chatExchangeId ?? id, // Use chatExchangeId or id from route params
    userId: reactionData.userId,
  },
})

    // Update or create reaction for the chat exchange
    const updatedReaction = await prisma.reaction.upsert({
      where: { id: existingReaction?.id }, // Use existing reaction id or a dummy value (0 will trigger creation)
  
      update: {
        reactionType: reactionData.reactionType,
        comment: reactionData.comment,
        artId: reactionData.artId,
        pitchId: reactionData.pitchId,
        componentId: reactionData.componentId,
        channelId: reactionData.channelId,
        ReactionCategory: reactionData.reactionCategory, // Correct field name
      },
      create: {
        reactionType: reactionData.reactionType,
        comment: reactionData.comment,
        userId: reactionData.userId,
        artId: reactionData.artId,
        pitchId: reactionData.pitchId,
        componentId: reactionData.componentId,
        channelId: reactionData.channelId,
        chatExchangeId: reactionData.chatExchangeId ?? id,
        ReactionCategory: reactionData.reactionCategory, // Correct field name
      },      
    })

    return {
      success: true,
      updatedReaction,
    }
  } catch (error: unknown) {
    console.error(
      `Error while updating reaction for chat exchange with id ${event.context.params?.id}:`,
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
