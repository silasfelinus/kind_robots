import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma, Reaction } from '@prisma/client'

interface ReactionInput extends Partial<Reaction> {
  componentName?: string
}

export default defineEventHandler(async (event) => {
  try {
    // Authorization Token Validation
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
    const reactionData = (await readBody(event)) as ReactionInput

    // Validate Required Fields
    if (!reactionData.reactionType || !reactionData.reactionCategory) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Reaction type and category are required.',
      })
    }

    // Default channel and chatExchange ID assignment if not provided
    const channelId = reactionData.channelId ?? 1
    const chatExchangeId = reactionData.chatExchangeId ?? null

    // Prepare Initial Data Object for Prisma
    const data: Prisma.ReactionCreateInput = {
      reactionType: reactionData.reactionType,
      reactionCategory: reactionData.reactionCategory,
      comment: reactionData.comment || '',
      rating: reactionData.rating || 0,
      User: { connect: { id: authenticatedUserId } },
      Channel: { connect: { id: channelId } }, // Default or provided channelId
      ...(chatExchangeId && {
        ChatExchange: { connect: { id: chatExchangeId } },
      }), // Optional chatExchangeId
    }

    // Attempt to Link the Appropriate Field Based on Reaction Category
    const linked = await getLinkField(reactionData, data)
    if (!linked) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: `${reactionData.reactionCategory} ID is required for ${reactionData.reactionCategory} reactions.`,
      })
    }

    console.log('Prepared data for Prisma:', data) // Log data to verify structure

    // Add or Update Reaction in the Database
    const result = await addOrUpdateReaction(data, authenticatedUserId)

    if (!result.reaction) {
      throw createError({
        statusCode: 500,
        message: result.message || 'Failed to create or update reaction.',
      })
    }

    event.node.res.statusCode = 201
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

// Helper Function to Link the Correct Field Based on Reaction Category
async function getLinkField(
  reactionData: ReactionInput,
  data: Prisma.ReactionCreateInput,
): Promise<boolean> {
  try {
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
        if (reactionData.componentId) {
          data.Component = { connect: { id: reactionData.componentId } }
          return true
        } else if (reactionData.componentName) {
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
      // Add additional cases for each category, ensuring optional fields
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
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: `Failed to process the linked field: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }
}
