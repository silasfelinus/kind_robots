// /server/api/reactions/chat/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { verifyJwtToken } from '../../auth'
import type { Reaction } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let chatExchangeId: number | null = null

  try {
    // Parse and validate the chatExchangeId from the URL params
    chatExchangeId = Number(event.context.params?.id)
    if (isNaN(chatExchangeId) || chatExchangeId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'ChatExchange ID is required and must be a valid number.',
      })
    }

    // Extract and validate the JWT token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = verificationResult.userId // Use userId from the token

    // Parse the request body as a partial reaction
    const reactionData: Partial<Reaction> = await readBody(event)

    // Ensure that reactionData includes at least one updatable field and required fields for creation
    if (!reactionData || Object.keys(reactionData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }
    if (!reactionData.reactionType) {
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
      // If the reaction exists, update it with the provided fields
      updatedReaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: reactionData,
      })
    } else {
      // If no reaction exists, create a new one with required fields and provided data
      updatedReaction = await prisma.reaction.create({
        data: {
          chatExchangeId,
          userId,
          reactionType: reactionData.reactionType, // Required field for creation
          ...reactionData,
        },
      })
    }

    return { success: true, updatedReaction }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message ||
        `Failed to update/create reaction for chat exchange with ID ${chatExchangeId}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
