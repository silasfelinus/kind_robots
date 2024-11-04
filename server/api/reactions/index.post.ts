// /server/api/reactions/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Prisma, Reaction } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Validate authorization token
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

    // Read reaction data from the request body
    const reactionData = await readBody<Partial<Reaction>>(event)

    // Ensure required fields are present
    if (!reactionData.reactionType || !reactionData.reactionCategory) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: '"reactionType" and "reactionCategory" are required fields.',
      })
    }

    // Set the user's ID in reaction data
    reactionData.userId = authenticatedUserId

    // Create or update the reaction
    const result = await addOrUpdateReaction(reactionData)

    if (result.error) {
      event.node.res.statusCode = 500
      throw createError({
        statusCode: 500,
        message: result.error,
      })
    }

    event.node.res.statusCode = 201 // Created
    return { success: true, reaction: result.reaction }
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

// Helper function to add or update a reaction
export async function addOrUpdateReaction(
  reactionData: Partial<Reaction>,
): Promise<{ reaction: Reaction | null; error: string | null }> {
  try {
    // Check if a similar reaction exists to determine update vs create
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        userId: reactionData.userId,
        reactionType: reactionData.reactionType,
        reactionCategory: reactionData.reactionCategory,
      },
    })

    let reaction
    if (existingReaction) {
      // Update the existing reaction
      reaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: reactionData as Prisma.ReactionUpdateInput,
      })
    } else {
      // Create a new reaction
      reaction = await prisma.reaction.create({
        data: reactionData as Prisma.ReactionCreateInput,
      })
    }

    return { reaction, error: null }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error'
    return {
      reaction: null,
      error: `Failed to process reaction: ${errorMessage}`,
    }
  }
}
