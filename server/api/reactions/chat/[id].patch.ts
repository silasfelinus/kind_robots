// /server/api/reactions/chat/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import type { Reaction } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let chatExchangeId: number | null = null
  let response

  try {
    // Parse and validate the chatExchangeId from the URL params
    chatExchangeId = Number(event.context.params?.id)
    if (isNaN(chatExchangeId) || chatExchangeId <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'ChatExchange ID is required and must be a valid number.',
      })
    }

    // Extract and validate the API key from the Authorization header
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

    const userId = user.id

    // Parse the request body as a partial reaction
    const reactionData: Partial<Reaction> = await readBody(event)

    // Ensure that reactionData includes necessary fields
    if (!reactionData || !reactionData.reactionType) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Reaction type is required.',
      })
    }

    // Check if the reaction already exists for this user and chat exchange
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        chatExchangeId,
        userId,
      },
    })

    let updatedReaction

    if (existingReaction) {
      // Update the existing reaction
      updatedReaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: reactionData,
      })
    } else {
      // Create a new reaction
      updatedReaction = await prisma.reaction.create({
        data: {
          chatExchangeId,
          userId,
          reactionType: reactionData.reactionType,
          ...reactionData,
        },
      })
    }

    response = { success: true, updatedReaction, statusCode: 200 }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to update/create reaction for chat exchange with ID ${chatExchangeId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
