// /server/api/reactions/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { type ReactionType, ReactionCategory } from '@prisma/client'

interface RequestData {
  userId: number
  reactionType: ReactionType
  reactionCategory: ReactionCategory
  artId?: number
  componentId?: number
  pitchId?: number
  channelId?: number
  comment?: string
}

export default defineEventHandler(async (event) => {
  let requestData: RequestData | undefined

  try {
    // Authorization check
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      return {
        success: false,
        message:
          'Authorization token is required in the format "Bearer <token>".',
        statusCode: 401,
      }
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      event.node.res.statusCode = 401
      return {
        success: false,
        message: 'Invalid or expired token.',
        statusCode: 401,
      }
    }

    const authenticatedUserId = user.id
    requestData = await readBody(event)

    // Ensure requestData is defined
    if (!requestData) {
      throw new Error('Invalid request data.')
    }

    const {
      userId,
      reactionType,
      reactionCategory,
      artId,
      componentId,
      pitchId,
      channelId,
      comment,
    } = requestData

    if (authenticatedUserId !== userId) {
      event.node.res.statusCode = 403
      return {
        success: false,
        message: 'User ID mismatch: authorization denied.',
        statusCode: 403,
      }
    }

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
        reactionType,
        reactionCategory,
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
          reactionCategory,
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
          reactionType,
          reactionCategory,
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
