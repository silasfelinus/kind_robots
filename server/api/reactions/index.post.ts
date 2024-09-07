// server/api/reactions/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Prisma, Reaction } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Read and validate the request body
    const reactionData = await readBody(event)

    if (!Array.isArray(reactionData)) {
      return {
        success: false,
        message: 'Invalid JSON body. Expected an array of reactions.',
        statusCode: 400, // Bad Request
      }
    }

    // Transform and validate reactions data according to your schema
    const transformedReactions: Prisma.ReactionCreateManyInput[] = reactionData.map((reaction) => ({
      comment: reaction.comment || null, // Optional field
      reaction: reaction.reaction || null, // Optional field
      isLoved: reaction.isLoved ?? false, // Boolean with default
      isClapped: reaction.isClapped ?? false, // Boolean with default
      isBooed: reaction.isBooed ?? false, // Boolean with default
      isHated: reaction.isHated ?? false, // Boolean with default
      userId: reaction.userId || 10, // Default value if userId is not provided
      artId: reaction.artId || null, // Optional artId
      pitchId: reaction.pitchId || null, // Optional pitchId
      componentId: reaction.componentId || null, // Optional componentId
      channelId: reaction.channelId || 1, // Default channelId
    }))

    // Batch create reactions and skip duplicates
    const newReactions = await addReactions(transformedReactions)

    return {
      success: true,
      newReactions,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    return {
      success: false,
      message: 'Failed to create new reactions.',
      error: message,
      statusCode: statusCode || 500, // Default to 500 if no specific status code
    }
  }
})

// Batch creation of reactions with Prisma
async function addReactions(reactionsData: Prisma.ReactionCreateManyInput[]): Promise<Reaction[]> {
  try {
    await prisma.reaction.createMany({
      data: reactionsData,
      skipDuplicates: true,
    })

    // Retrieve the newly created reactions
    const newReactions = await prisma.reaction.findMany({
      where: {
        OR: reactionsData.map((reaction) => ({
          userId: reaction.userId,
          artId: reaction.artId || null,
          pitchId: reaction.pitchId || null,
          componentId: reaction.componentId || null,
          channelId: reaction.channelId || 1,
        })),
      },
    })

    return newReactions
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(errorMessage)
  }
}
