import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma } from '@prisma/client'

interface ReactionInput extends Prisma.ReactionCreateInput {
  componentName?: string
  channelId?: number
  chatExchangeId?: number
  artId?: number
  artImageId?: number
  componentId?: number
  galleryId?: number
  messageId?: number
  postId?: number
  promptId?: number
  resourceId?: number
  rewardId?: number
  tagId?: number
}

export default defineEventHandler(async (event) => {
  try {
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      console.error('Missing or malformed authorization header')
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Authorization token required in format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })
    if (!user) {
      console.error('Invalid or expired token')
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id
    const reactionData = (await readBody(event)) as ReactionInput

    if (!reactionData.reactionType || !reactionData.reactionCategory) {
      console.error('Missing required fields: reactionType or reactionCategory')
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Reaction type and category are required.',
      })
    }

    // Prepare data with all optional fields conditionally set to connect or null
    const data: Prisma.ReactionCreateInput = {
      reactionType: reactionData.reactionType,
      reactionCategory: reactionData.reactionCategory,
      comment: reactionData.comment || '',
      rating: reactionData.rating || 0,
      User: { connect: { id: authenticatedUserId } },
      Channel: reactionData.channelId
        ? { connect: { id: reactionData.channelId } }
        : undefined,
      ChatExchange: reactionData.chatExchangeId
        ? { connect: { id: reactionData.chatExchangeId } }
        : undefined,
      Art: reactionData.artId
        ? { connect: { id: reactionData.artId } }
        : undefined,
      ArtImage: reactionData.artImageId
        ? { connect: { id: reactionData.artImageId } }
        : undefined,
      Component: reactionData.componentId
        ? { connect: { id: reactionData.componentId } }
        : undefined,
      Gallery: reactionData.galleryId
        ? { connect: { id: reactionData.galleryId } }
        : undefined,
      Message: reactionData.messageId
        ? { connect: { id: reactionData.messageId } }
        : undefined,
      Post: reactionData.postId
        ? { connect: { id: reactionData.postId } }
        : undefined,
      Prompt: reactionData.promptId
        ? { connect: { id: reactionData.promptId } }
        : undefined,
      Resource: reactionData.resourceId
        ? { connect: { id: reactionData.resourceId } }
        : undefined,
      Reward: reactionData.rewardId
        ? { connect: { id: reactionData.rewardId } }
        : undefined,
      Tag: reactionData.tagId
        ? { connect: { id: reactionData.tagId } }
        : undefined,
    }

    console.log('Prepared data for Prisma:', data)

    const result = await addOrUpdateReaction(data, authenticatedUserId)
    if (!result.reaction) {
      console.error('Failed to create or update reaction:', result.message)
      throw createError({
        statusCode: 500,
        message: result.message || 'Failed to create or update reaction.',
      })
    }

    event.node.res.statusCode = 201
    return { success: true, reaction: result.reaction, message: result.message }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    console.error('Error:', message)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to create or update reaction',
      statusCode: statusCode || 500,
    }
  }
})

// Function to Add or Update a Reaction in the Database
async function addOrUpdateReaction(
  data: Prisma.ReactionCreateInput,
  authenticatedUserId: number,
): Promise<{ reaction: Reaction | null; message: string | null }> {
  try {
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        userId: authenticatedUserId,
        reactionType: data.reactionType,
        reactionCategory: data.reactionCategory,
      },
    })

    if (existingReaction) {
      const reaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data,
      })
      console.log('Reaction updated successfully')
      return { reaction, message: 'Reaction updated successfully' }
    } else {
      const reaction = await prisma.reaction.create({ data })
      console.log('Reaction created successfully')
      return { reaction, message: 'Reaction created successfully' }
    }
  } catch (error: unknown) {
    console.error('Database error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return { reaction: null, message: errorMessage }
  }
}
