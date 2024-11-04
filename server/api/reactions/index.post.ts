// /server/api/reactions/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma, Reaction } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Authorization token validation
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id

    // Parse the reaction data from the request
    const reactionData = await readBody<Partial<Reaction>>(event)

    // Simple authorization check for userId
    if (reactionData.userId && reactionData.userId !== authenticatedUserId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message:
          'User ID in the request data does not match the authenticated user.',
      })
    }

    // Construct data object for Prisma, with conditionally included relations
    const data: Prisma.ReactionCreateInput = {
      reactionType: reactionData.reactionType ?? 'NEUTRAL',
      reactionCategory: reactionData.reactionCategory ?? 'ART',
      comment: reactionData.comment || '',
      rating: reactionData.rating ?? 0,
      User: { connect: { id: authenticatedUserId } },
      ...(reactionData.artImageId && {
        ArtImage: { connect: { id: reactionData.artImageId } },
      }),
      ...(reactionData.artId && {
        Art: { connect: { id: reactionData.artId } },
      }),
      ...(reactionData.pitchId && {
        Pitch: { connect: { id: reactionData.pitchId } },
      }),
      ...(reactionData.componentId && {
        Component: { connect: { id: reactionData.componentId } },
      }),
      ...(reactionData.channelId && {
        Channel: { connect: { id: reactionData.channelId } },
      }),
      ...(reactionData.chatExchangeId && {
        ChatExchange: { connect: { id: reactionData.chatExchangeId } },
      }),
      ...(reactionData.botId && {
        Bot: { connect: { id: reactionData.botId } },
      }),
      ...(reactionData.galleryId && {
        Gallery: { connect: { id: reactionData.galleryId } },
      }),
      ...(reactionData.messageId && {
        Message: { connect: { id: reactionData.messageId } },
      }),
      ...(reactionData.postId && {
        Post: { connect: { id: reactionData.postId } },
      }),
      ...(reactionData.promptId && {
        Prompt: { connect: { id: reactionData.promptId } },
      }),
      ...(reactionData.resourceId && {
        Resource: { connect: { id: reactionData.resourceId } },
      }),
      ...(reactionData.rewardId && {
        Reward: { connect: { id: reactionData.rewardId } },
      }),
      ...(reactionData.tagId && {
        Tag: { connect: { id: reactionData.tagId } },
      }),
    }

    // Create the new reaction in the database
    const newReaction = await prisma.reaction.create({ data })

    event.node.res.statusCode = 201 // Created
    return { success: true, reaction: newReaction }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to create or update reaction',
      statusCode: statusCode || 500,
    }
  }
})
