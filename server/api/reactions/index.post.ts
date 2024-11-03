import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma, Reaction } from '@prisma/client'

// Extend Reaction type to include componentName as an optional property
interface ReactionInput extends Partial<Reaction> {
  componentName?: string
}

export default defineEventHandler(async (event) => {
  try {
    // Validate authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
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
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id

    // Read and validate the reaction data
    const reactionData = (await readBody(event)) as ReactionInput

    // Check for required reaction type and category fields
    if (!reactionData.reactionType || !reactionData.reactionCategory) {
      throw createError({
        statusCode: 400,
        message: 'Reaction type and category are required.',
      })
    }

    // Prepare data object for Prisma, initializing required fields
    const data: Prisma.ReactionCreateInput = {
      reactionType: reactionData.reactionType,
      reactionCategory: reactionData.reactionCategory,
      comment: reactionData.comment || '',
      rating: reactionData.rating || 0,
      User: { connect: { id: authenticatedUserId } },
    }

    // Link the appropriate relation based on reactionCategory
    const linked = await getLinkField(reactionData, data)

    if (!linked) {
      throw createError({
        statusCode: 400,
        message: `${reactionData.reactionCategory} ID is required for ${reactionData.reactionCategory} reactions.`,
      })
    }

    // Proceed with adding or updating the reaction
    const result = await addOrUpdateReaction(data, authenticatedUserId)

    if (!result.reaction) {
      throw createError({
        statusCode: 500,
        message: result.message || 'Failed to create or update reaction.',
      })
    }

    return { success: true, reaction: result.reaction, message: result.message }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to create or update reaction',
      statusCode: statusCode || 500,
    }
  }
})

// Function to add or update a reaction in the database
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
      return { reaction, message: 'Reaction updated successfully' }
    } else {
      const reaction = await prisma.reaction.create({ data })
      return { reaction, message: 'Reaction created successfully' }
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return { reaction: null, message: errorMessage }
  }
}

// Helper function to link the correct field based on reaction category
async function getLinkField(
  reactionData: ReactionInput,
  data: Prisma.ReactionCreateInput,
): Promise<boolean> {
  switch (reactionData.reactionCategory) {
    case 'ART':
      if (reactionData.artId) {
        data.Art = { connect: { id: reactionData.artId } }
        return true
      }
      break
    case 'ART_IMAGE':
      if (reactionData.artImageId) {
        data.ArtImage = { connect: { id: reactionData.artImageId } }
        return true
      }
      break
    case 'COMPONENT':
      if (reactionData.componentName) {
        const component = await prisma.component.findFirst({
          where: { componentName: reactionData.componentName },
          select: { id: true },
        })
        if (component) {
          data.Component = { connect: { id: component.id } }
          return true
        } else {
          throw createError({
            statusCode: 404,
            message: `Component with name "${reactionData.componentName}" not found.`,
          })
        }
      }
      break
    case 'PITCH':
      if (reactionData.pitchId) {
        data.Pitch = { connect: { id: reactionData.pitchId } }
        return true
      }
      break
    case 'CHANNEL':
      if (reactionData.channelId) {
        data.Channel = { connect: { id: reactionData.channelId } }
        return true
      }
      break
    case 'CHAT_EXCHANGE':
      if (reactionData.chatExchangeId) {
        data.ChatExchange = { connect: { id: reactionData.chatExchangeId } }
        return true
      }
      break
    case 'BOT':
      if (reactionData.botId) {
        data.Bot = { connect: { id: reactionData.botId } }
        return true
      }
      break
    case 'GALLERY':
      if (reactionData.galleryId) {
        data.Gallery = { connect: { id: reactionData.galleryId } }
        return true
      }
      break
    case 'MESSAGE':
      if (reactionData.messageId) {
        data.Message = { connect: { id: reactionData.messageId } }
        return true
      }
      break
    case 'POST':
      if (reactionData.postId) {
        data.Post = { connect: { id: reactionData.postId } }
        return true
      }
      break
    case 'PROMPT':
      if (reactionData.promptId) {
        data.Prompt = { connect: { id: reactionData.promptId } }
        return true
      }
      break
    case 'RESOURCE':
      if (reactionData.resourceId) {
        data.Resource = { connect: { id: reactionData.resourceId } }
        return true
      }
      break
    case 'REWARD':
      if (reactionData.rewardId) {
        data.Reward = { connect: { id: reactionData.rewardId } }
        return true
      }
      break
    case 'TAG':
      if (reactionData.tagId) {
        data.Tag = { connect: { id: reactionData.tagId } }
        return true
      }
      break
    default:
      return false
  }
  return false
}
