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

    // Read and validate the request body
    const reactionData = await readBody<Partial<Reaction>>(event)

    // Validate required fields
    if (!reactionData.reactionType || !reactionData.reactionCategory) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: '"reactionType" and "reactionCategory" are required fields.',
      })
    }

    // Prepare the data object for the new reaction, excluding userId from reactionData
    const { userId, ...reactionInput } = reactionData

    // Create the reaction with the connected authenticated user
    const newReaction = await prisma.reaction.create({
      data: {
        ...reactionInput,
        User: { connect: { id: authenticatedUserId } },
      } as Prisma.ReactionCreateInput,
    })

    // Set status code to 201 Created for successful creation
    event.node.res.statusCode = 201
    return { success: true, reaction: newReaction }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message.includes('token')
        ? message
        : 'Failed to create or update reaction',
      error: message,
      statusCode: statusCode || 500,
    }
  }
})
