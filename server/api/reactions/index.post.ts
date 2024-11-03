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

    // Read and validate reaction data from the request body
    const reactionData = await readBody<Partial<Reaction>>(event)

    // Validate required fields
    if (!reactionData.reactionType || !reactionData.reactionCategory) {
      return {
        success: false,
        message: '"reactionType" and "reactionCategory" are required fields.',
        statusCode: 400,
      }
    }

    // Add the authenticated user's ID to the reaction data
    reactionData.userId = authenticatedUserId

    // Create or update the reaction
    const result = await addOrUpdateReaction(reactionData)

    if (result.error) {
      throw new Error(result.error)
    }

    return { success: true, reaction: result.reaction, statusCode: 201 }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    return {
      success: false,
      message: 'Failed to create or update reaction',
      error: message || 'An unknown error occurred',
      statusCode: statusCode || 500,
    }
  }
})

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
