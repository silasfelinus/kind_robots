// server/api/reactions/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { ReactionType } from '@prisma/client'
import { ReactionCategory } from '@prisma/client'

interface RequestData {
  userId: number
  reactionType: ReactionType
  reactionCategory: ReactionCategory
  comment?: string
  rating?: number
  artImageId?: number
  artId?: number
  pitchId?: number
  componentId?: number
  channelId?: number
  chatExchangeId?: number
  botId?: number
  galleryId?: number
  messageId?: number
  postId?: number
  promptId?: number
  resourceId?: number
  rewardId?: number
  tagId?: number
}

export default defineEventHandler(async (event) => {
  let requestData: RequestData | undefined

  try {
    requestData = await readBody(event)

    if (!requestData) {
      throw new Error('Invalid request data.')
    }

    const {
      userId,
      reactionType,
      reactionCategory,
      comment,
      rating = 0,
      artImageId,
      artId,
      pitchId,
      componentId,
      channelId,
      chatExchangeId,
      botId,
      galleryId,
      messageId,
      postId,
      promptId,
      resourceId,
      rewardId,
      tagId,
    } = requestData

    if (!userId || !reactionType || !reactionCategory) {
      throw new Error(
        'Missing required fields: userId, reactionType, or reactionCategory.',
      )
    }

    // Determine specific match conditions based on ReactionCategory
    let reactionMatchCondition: { [key: string]: number } = {}
    switch (reactionCategory) {
      case ReactionCategory.ART:
        if (!artId) throw new Error('artId is required for Art reactions.')
        reactionMatchCondition = { artId }
        break
      case ReactionCategory.ART_IMAGE:
        if (!artImageId)
          throw new Error('artImageId is required for Art Image reactions.')
        reactionMatchCondition = { artImageId }
        break
      case ReactionCategory.COMPONENT:
        if (!componentId)
          throw new Error('componentId is required for Component reactions.')
        reactionMatchCondition = { componentId }
        break
      case ReactionCategory.PITCH:
        if (!pitchId)
          throw new Error('pitchId is required for Pitch reactions.')
        reactionMatchCondition = { pitchId }
        break
      case ReactionCategory.CHANNEL:
        if (!channelId)
          throw new Error('channelId is required for Channel reactions.')
        reactionMatchCondition = { channelId }
        break
      case ReactionCategory.CHAT_EXCHANGE:
        if (!chatExchangeId)
          throw new Error(
            'chatExchangeId is required for Chat Exchange reactions.',
          )
        reactionMatchCondition = { chatExchangeId }
        break
      case ReactionCategory.BOT:
        if (!botId) throw new Error('botId is required for Bot reactions.')
        reactionMatchCondition = { botId }
        break
      case ReactionCategory.GALLERY:
        if (!galleryId)
          throw new Error('galleryId is required for Gallery reactions.')
        reactionMatchCondition = { galleryId }
        break
      case ReactionCategory.MESSAGE:
        if (!messageId)
          throw new Error('messageId is required for Message reactions.')
        reactionMatchCondition = { messageId }
        break
      case ReactionCategory.POST:
        if (!postId) throw new Error('postId is required for Post reactions.')
        reactionMatchCondition = { postId }
        break
      case ReactionCategory.PROMPT:
        if (!promptId)
          throw new Error('promptId is required for Prompt reactions.')
        reactionMatchCondition = { promptId }
        break
      case ReactionCategory.RESOURCE:
        if (!resourceId)
          throw new Error('resourceId is required for Resource reactions.')
        reactionMatchCondition = { resourceId }
        break
      case ReactionCategory.REWARD:
        if (!rewardId)
          throw new Error('rewardId is required for Reward reactions.')
        reactionMatchCondition = { rewardId }
        break
      case ReactionCategory.TAG:
        if (!tagId) throw new Error('tagId is required for Tag reactions.')
        reactionMatchCondition = { tagId }
        break
      default:
        throw new Error('Unsupported ReactionCategory.')
    }

    // Check if a reaction by the user on this item already exists
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        userId,
        reactionType,
        reactionCategory,
        ...reactionMatchCondition,
      },
    })

    if (existingReaction) {
      // Update existing reaction
      const updatedReaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: {
          comment,
          rating,
          reactionType,
          reactionCategory,
          ...reactionMatchCondition,
        },
      })

      return {
        success: true,
        reaction: updatedReaction,
        message: 'Reaction updated successfully',
      }
    } else {
      // Create a new reaction
      const newReaction = await prisma.reaction.create({
        data: {
          userId,
          reactionType,
          reactionCategory,
          rating,
          comment,
          ...reactionMatchCondition,
        },
      })

      return {
        success: true,
        reaction: newReaction,
        reactionId: newReaction.id,
        message: 'Reaction created successfully',
      }
    }
  } catch (error) {
    const err = error as Error
    console.error('Error in Reaction Management:', {
      error: err.message,
      requestData,
    })
    return errorHandler({
      error: err,
      context: 'Reaction Management - POST',
    })
  }
})
