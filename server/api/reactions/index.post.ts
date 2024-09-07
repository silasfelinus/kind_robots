import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { ReactionType } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const requestData = await readBody(event)

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

    let reactionIdField: 'artId' | 'componentId' | 'pitchId' | 'channelId' | undefined // Allow undefined initially
    let reactionMatchCondition: { [key: string]: number } = {} // Declare as an object with string keys and number values

    // Determine which field to use based on the reactionType
    switch (reactionType) {
      case ReactionType.Art:
        reactionIdField = 'artId'
        if (!artId) throw new Error('artId is required for Art reactions.')
        reactionMatchCondition = { artId }
        break
      case ReactionType.Component:
        reactionIdField = 'componentId'
        if (!componentId) throw new Error('componentId is required for Component reactions.')
        reactionMatchCondition = { componentId }
        break
      case ReactionType.Pitch:
        reactionIdField = 'pitchId'
        if (!pitchId) throw new Error('pitchId is required for Pitch reactions.')
        reactionMatchCondition = { pitchId }
        break
      case ReactionType.Channel:
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
          isLoved: requestData.isLoved,
          isClapped: requestData.isClapped,
          isBooed: requestData.isBooed,
          isHated: requestData.isHated,
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
          ReactionType: reactionType,
          [reactionIdField]: reactionMatchCondition[reactionIdField], // Dynamic key access
          reaction,
          title,
          comment,
          isLoved: requestData.isLoved || false,
          isClapped: requestData.isClapped || false,
          isBooed: requestData.isBooed || false,
          isHated: requestData.isHated || false,
        },
      })

      return {
        success: true,
        reaction: newReaction,
        message: 'Reaction created successfully',
      }
    }
  } catch (error) {
    return errorHandler({
      error,
      context: 'Reaction Management - POST',
    })
  }
})
