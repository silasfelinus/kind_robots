// /server/api/reactions/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Reaction } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Validate authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      return {
        success: false,
        message:
          'Authorization token is required in the format "Bearer <token>".',
        statusCode: 401,
      }
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      event.node.res.statusCode = 401
      return {
        success: false,
        message: 'Invalid or expired token.',
        statusCode: 401,
      }
    }

    const authenticatedUserId = user.id

    // Read and validate the request body
    const reactionData = await readBody<Partial<Reaction>>(event)

    // Validate required fields
    if (!reactionData.reactionType || !reactionData.reactionCategory) {
      event.node.res.statusCode = 400
      return {
        success: false,
        message: '"reactionType" and "reactionCategory" are required fields.',
        statusCode: 400,
      }
    }

    // Create the reaction with conditional relationships
    const newReaction = await prisma.reaction.create({
      data: {
        reactionType: reactionData.reactionType,
        reactionCategory: reactionData.reactionCategory,
        comment: reactionData.comment || '',
        rating: reactionData.rating || 0,
        User: { connect: { id: authenticatedUserId } },
        ...(reactionData.artId && {
          Art: { connect: { id: reactionData.artId } },
        }),
        ...(reactionData.channelId && {
          Channel: { connect: { id: reactionData.channelId } },
        }),
        ...(reactionData.chatExchangeId && {
          ChatExchange: { connect: { id: reactionData.chatExchangeId } },
        }),
        ...(reactionData.artImageId && {
          ArtImage: { connect: { id: reactionData.artImageId } },
        }),
      },
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
