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

    // Define required fields for each reaction category
    const requiredFields: { [key: string]: keyof Reaction } = {
      ART: 'artId',
      ART_IMAGE: 'artImageId',
      COMPONENT: 'componentId', // Adjusted to handle by name below
      PITCH: 'pitchId',
      CHANNEL: 'channelId',
      CHAT_EXCHANGE: 'chatExchangeId',
      BOT: 'botId',
      GALLERY: 'galleryId',
      MESSAGE: 'messageId',
      POST: 'postId',
      PROMPT: 'promptId',
      RESOURCE: 'resourceId',
      REWARD: 'rewardId',
      TAG: 'tagId',
    }

    let requiredField = requiredFields[reactionData.reactionCategory]

    // Special handling for COMPONENT category by component name
    // Special handling for COMPONENT category by component name
    if (
      reactionData.reactionCategory === 'COMPONENT' &&
      reactionData.componentName
    ) {
      const component = await prisma.component.findFirst({
        where: { componentName: reactionData.componentName }, // Use componentName instead of name
        select: { id: true },
      })

      if (!component) {
        throw createError({
          statusCode: 404,
          message: `Component with name "${reactionData.componentName}" not found.`,
        })
      }

      // Replace componentId in reactionData with the found ID
      reactionData.componentId = component.id
      requiredField = 'componentId'
    } else if (!reactionData[requiredField]) {
      throw createError({
        statusCode: 400,
        message: `${requiredField} is required for ${reactionData.reactionCategory} reactions.`,
      })
    }

    // Proceed with adding or updating the reaction
    const result = await addOrUpdateReaction(
      reactionData,
      requiredField,
      authenticatedUserId,
    )

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

async function addOrUpdateReaction(
  reactionData: ReactionInput,
  requiredField: keyof Reaction | undefined,
  authenticatedUserId: number,
): Promise<{ reaction: Reaction | null; message: string | null }> {
  try {
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        userId: authenticatedUserId,
        reactionType: reactionData.reactionType,
        reactionCategory: reactionData.reactionCategory,
        ...(requiredField && { [requiredField]: reactionData[requiredField] }),
      },
    })

    if (existingReaction) {
      const reaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: {
          ...reactionData,
          userId: undefined, // Ensure userId is not directly assigned
        } as Prisma.ReactionUpdateInput,
      })
      return { reaction, message: 'Reaction updated successfully' }
    } else {
      const { userId, ...reactionInput } = reactionData // Exclude userId from input data

      const reaction = await prisma.reaction.create({
        data: {
          ...reactionInput,
          User: { connect: { id: authenticatedUserId } }, // Connect authenticated user
        } as Prisma.ReactionCreateInput,
      })
      return { reaction, message: 'Reaction created successfully' }
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return { reaction: null, message: errorMessage }
  }
}
