import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
// Import Prisma-generated types
import type { ReactionType } from '@prisma/client'
import { ReactionCategory } from '@prisma/client'

// Define the type for requestData manually (if not part of Prisma)
interface RequestData {
  userId: number
  reactionType: ReactionType // ReactionType is the specific reaction (e.g., LOVED, CLAPPED)
  reactionCategory: ReactionCategory // Use the Prisma-generated ReactionCategory enum
  artId?: number
  componentId?: number
  pitchId?: number
  channelId?: number
  comment?: string
}

export default defineEventHandler(async (event) => {
  let requestData: RequestData | undefined

  try {
    requestData = await readBody(event)

    // Ensure requestData is defined
    if (!requestData) {
      throw new Error('Invalid request data.')
    }

    const {
      userId,
      reactionType, // reactionType is directly from the Prisma enum
      reactionCategory, // reactionCategory (ART, COMPONENT, etc.)
      artId,
      componentId,
      pitchId,
      channelId,
      comment,
    } = requestData

    if (!userId || !reactionType || !reactionCategory) {
      throw new Error(
        'Missing required fields: userId, reactionType, or ReactionCategory.',
      )
    }

    let reactionMatchCondition: { [key: string]: number } = {}

    // Use the ReactionCategory enum values directly
    switch (reactionCategory) {
      case ReactionCategory.ART:
        if (!artId) throw new Error('artId is required for Art reactions.')
        reactionMatchCondition = { artId }
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
      default:
        throw new Error('Unsupported ReactionCategory.')
    }

    // Check if the user already reacted to the same item (art, component, pitch, or channel)
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        userId,
        reactionType, // Use the mapped ReactionType enum value
        reactionCategory: reactionCategory, // Ensure reactionCategory is also checked
        ...reactionMatchCondition,
      },
    })

    if (existingReaction) {
      // Update the existing reaction
      const updatedReaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: {
          comment,
          reactionType,
          reactionCategory: reactionCategory,
          artId: reactionCategory === ReactionCategory.ART ? artId : undefined,
          componentId:
            reactionCategory === ReactionCategory.COMPONENT
              ? componentId
              : undefined,
          pitchId:
            reactionCategory === ReactionCategory.PITCH ? pitchId : undefined,
          channelId:
            reactionCategory === ReactionCategory.CHANNEL
              ? channelId
              : undefined,
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
          reactionType, // Use the mapped ReactionType enum value
          reactionCategory: reactionCategory, // Add the reactionCategory
          artId: reactionCategory === ReactionCategory.ART ? artId : undefined,
          componentId:
            reactionCategory === ReactionCategory.COMPONENT
              ? componentId
              : undefined,
          pitchId:
            reactionCategory === ReactionCategory.PITCH ? pitchId : undefined,
          channelId:
            reactionCategory === ReactionCategory.CHANNEL
              ? channelId
              : undefined,
          comment,
        },
      })

      return {
        success: true,
        reaction: newReaction,
        reactionId: newReaction.id, // Return reaction ID
        message: 'Reaction created successfully',
      }
    }
  } catch (error) {
    // Ensure error is cast to the appropriate type
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
