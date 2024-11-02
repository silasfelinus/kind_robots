// server/api/reactions/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma, Reaction } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const reactionData = await readBody(event)
    const result = await addOrUpdateReaction(reactionData)
    return { success: true, ...result }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    return {
      success: false,
      message: 'Failed to create or update reaction',
      error: message,
      statusCode: statusCode || 500,
    }
  }
})

async function addOrUpdateReaction(
  reactionData: Partial<Reaction>,
): Promise<{ reaction: Reaction | null; message: string | null }> {
  const { userId, reactionType, reactionCategory } = reactionData

  if (!userId || !reactionType || !reactionCategory) {
    return {
      reaction: null,
      message: 'userId, reactionType, and reactionCategory are required.',
    }
  }

  const requiredFields: { [key: string]: keyof Reaction } = {
    ART: 'artId',
    ART_IMAGE: 'artImageId',
    COMPONENT: 'componentId',
    PITCH: 'pitchId',
    CHANNEL: 'channelId',
    CHAT_EXCHANGE: 'chatExchangeId',
    BOT: 'botId',
    GALLERY: 'galleryId',
    MESSAGE: 'messageId',
    POST: 'postId',
    PROMPT: 'promptId',
    RESOURCE: 'resourceId',
    REWARD: 'rewardId',
    TAG: 'tagId',
  }

  const requiredField = requiredFields[reactionCategory]
  if (requiredField && !reactionData[requiredField]) {
    return {
      reaction: null,
      message: `${requiredField} is required for ${reactionCategory} reactions.`,
    }
  }

  try {
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        userId,
        reactionType,
        reactionCategory,
        [requiredField!]: reactionData[requiredField!],
      },
    })

    if (existingReaction) {
      const reaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: reactionData as Prisma.ReactionUpdateInput,
      })
      return { reaction, message: 'Reaction updated successfully' }
    } else {
      const reaction = await prisma.reaction.create({
        data: reactionData as Prisma.ReactionCreateInput,
      })
      return { reaction, message: 'Reaction created successfully' }
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return { reaction: null, message: errorMessage }
  }
}
