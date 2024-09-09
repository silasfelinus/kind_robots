import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { ReactionType } from '@prisma/client' // Proper import for ReactionType enum

// Define the type for requestData
interface RequestData {
  userId: number
  reactionType: string // Allow string input from client
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

// Function to map string input to the ReactionType enum
function mapReactionType(type: string): ReactionType | undefined {
  // Convert the string to uppercase and match it to the enum value
  const normalizedType = type.toUpperCase() as keyof typeof ReactionType
  return ReactionType[normalizedType] // Map to ReactionType enum
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
      reactionType, // reactionType is a string to be normalized
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

    // Map reactionType string to the enum value
    const mappedReactionType = mapReactionType(reactionType)
    if (!mappedReactionType) {
      throw new Error('Invalid reactionType provided.')
    }

    let reactionIdField:
      | 'artId'
      | 'componentId'
      | 'pitchId'
      | 'channelId'
      | undefined
    let reactionMatchCondition: { [key: string]: number } = {}

    // Determine which field to use based on the mapped ReactionType
    switch (mappedReactionType) {
      case ReactionType.ART:
        reactionIdField = 'artId'
        if (!artId) throw new Error('artId is required for Art reactions.')
        reactionMatchCondition = { artId }
        break
      case ReactionType.COMPONENT:
        reactionIdField = 'componentId'
        if (!componentId)
          throw new Error('componentId is required for Component reactions.')
        reactionMatchCondition = { componentId }
        break
      case ReactionType.PITCH:
        reactionIdField = 'pitchId'
        if (!pitchId)
          throw new Error('pitchId is required for Pitch reactions.')
        reactionMatchCondition = { pitchId }
        break
      case ReactionType.CHANNEL:
        reactionIdField = 'channelId'
        if (!channelId)
          throw new Error('channelId is required for Channel reactions.')
        reactionMatchCondition = { channelId }
        break
      default:
        throw new Error('Unsupported ReactionType.')
    }

    // Check if the user already reacted to the same item (art, component, pitch, or channel)
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        userId,
        ReactionType: mappedReactionType, // Use the mapped ReactionType enum value
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
          isLoved: requestData.isLoved ?? false, // Fallback to `false`
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
        throw new Error(
          `${reactionIdField} is required for this reaction type.`,
        )
      }

      // Create a new reaction
      const newReaction = await prisma.reaction.create({
        data: {
          userId,
          ReactionType: mappedReactionType, // Use the mapped ReactionType enum value
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
