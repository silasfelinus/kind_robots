import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { ReactionType } from '@prisma/client'

// Define the type for requestData
interface RequestData {
  userId: number
  reactionType: ReactionType
  artId?: number
  componentId?: number
  pitchId?: number
  channelId?: number
  reaction?: string
  title?: string
  comment?: string
  isLoved?: boolean
  isClapped?: boolean
  isBooed?: boolean
  isHated?: boolean
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
      reactionType,
      artId,
      componentId,
      pitchId,
      channelId,
      reaction,
      title,
      comment,
    } = requestData

    if (!userId || !reactionType) {
      throw new Error('Missing required fields: userId or reactionType.')
    }

    // Ensure reactionType is valid
    const validReactionTypes = Object.values(ReactionType)
    if (!validReactionTypes.includes(reactionType)) {
      throw new Error('Invalid reaction type.')
    }

    let reactionIdField: 'artId' | 'componentId' | 'pitchId' | 'channelId' | undefined
    let reactionMatchCondition: { [key: string]: number } = {}

    // Determine which field to use based on the reactionType
    switch (reactionType) {
      case ReactionType.ART:
        reactionIdField = 'artId'
        if (!artId) throw new Error('artId is required for Art reactions.')
        reactionMatchCondition = { artId }
        break
      case ReactionType.COMPONENT:
        reactionIdField = 'componentId'
        if (!componentId) throw new Error('componentId is required for Component reactions.')
        reactionMatchCondition = { componentId }
        break
      case ReactionType.PITCH:
        reactionIdField = 'pitchId'
        if (!pitchId) throw new Error('pitchId is required for Pitch reactions.')
        reactionMatchCondition = { pitchId }
        break
      case ReactionType.CHANNEL:
        reactionIdField = 'channelId'
        if (!channelId) throw new Error('channelId is required for Channel reactions.')
        reactionMatchCondition = { channelId }
        break
      default:
        throw new Error('Unsupported ReactionType.')
    }

    // Check if the user already reacted to the same item (art, component, pitch, or channel)
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        userId,
        ReactionType: reactionType,
        ...reactionMatchCondition,
      },
    })

    if (existingReaction) {
      // Update the existing reaction
      const updatedReaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: {
          reaction,
          title,
          comment,
          isLoved: requestData.isLoved ?? false,  // Fallback to `false`
          isClapped: requestData.isClapped ?? false,
          isBooed: requestData.isBooed ?? false,
          isHated: requestData.isHated ?? false,
        },
      })

      return {
        success: true,
        reaction: updatedReaction,
        message: 'Reaction updated successfully',
      }
    } else {
      // Validate reactionIdField is properly assigned
      if (!reactionIdField || !reactionMatchCondition[reactionIdField]) {
        throw new Error(`${reactionIdField} is required for this reaction type.`)
      }

      // Create a new reaction
      const newReaction = await prisma.reaction.create({
        data: {
          userId,
          ReactionType: reactionType,
          [reactionIdField]: reactionMatchCondition[reactionIdField],
          reaction,
          title,
          comment,
          isLoved: requestData.isLoved ?? false,
          isClapped: requestData.isClapped ?? false,
          isBooed: requestData.isBooed ?? false,
          isHated: requestData.isHated ?? false,
        },
      })

      return {
        success: true,
        reaction: newReaction,
        reactionId: newReaction.id,  // Return reaction ID
        message: 'Reaction created successfully',
      }
    }
  } catch (error) {
    // Ensure error is cast to the appropriate type
    const err = error as Error
    console.error('Error in Reaction Management:', { error: err.message, requestData })
    return errorHandler({
      error: err,
      context: 'Reaction Management - POST',
    })
  }
})
