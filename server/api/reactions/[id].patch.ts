// /server/api/reactions/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { verifyJwtToken } from '../auth'
import type { Reaction } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let reactionId: number | null = null

  try {
    // Parse and validate the reaction ID from the URL params
    reactionId = Number(event.context.params?.id)
    if (isNaN(reactionId) || reactionId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Missing or invalid reaction ID.',
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

    // Read and parse the request data as partial Reaction data
    const requestData: Partial<Reaction> = await readBody(event)
    const { reactionType, reactionCategory } = requestData

    // Ensure required fields are provided if necessary
    if (!reactionType || !reactionCategory) {
      throw createError({
        statusCode: 400,
        message: 'Reaction type and category are required.',
      })
    }

    // Fetch the existing reaction to ensure it exists and verify ownership
    const existingReaction = await prisma.reaction.findUnique({
      where: { id: reactionId },
    })

    if (!existingReaction) {
      throw createError({
        statusCode: 404,
        message: 'Reaction not found.',
      })
    }

    if (existingReaction.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this reaction.',
      })
    }

    // Update the reaction in the database
    const updatedReaction = await prisma.reaction.update({
      where: { id: reactionId },
      data: requestData,
    })

    return {
      success: true,
      reaction: updatedReaction,
      message: 'Reaction updated successfully',
    }
  } catch (error) {
    return errorHandler({
      error,
      context: 'Reaction Management - PATCH',
    })
  }
})
