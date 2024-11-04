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

    // Read reaction data from the request body
    const reactionData = await readBody<Partial<Reaction>>(event)

    // Ensure required fields are present
    if (!reactionData.reactionType || !reactionData.reactionCategory) {
      throw createError({
        statusCode: 400,
        message: '"reactionType" and "reactionCategory" are required fields.',
      })
    }

    // Set the user's ID in reaction data
    reactionData.userId = authenticatedUserId

    // Create or update the reaction
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        userId: reactionData.userId,
        reactionType: reactionData.reactionType,
        reactionCategory: reactionData.reactionCategory,
      },
    })

    const reaction = existingReaction
      ? await prisma.reaction.update({
          where: { id: existingReaction.id },
          data: reactionData as Prisma.ReactionUpdateInput,
        })
      : await prisma.reaction.create({
          data: reactionData as Prisma.ReactionCreateInput,
        })

    event.node.res.statusCode = 201 // Created
    return { success: true, reaction }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message,
      statusCode: statusCode || 500,
    }
  }
})
