// /server/api/reactions/pitch/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { verifyJwtToken } from '../../auth'
import type { Reaction } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let pitchId: number | null = null

  try {
    // Parse and validate the pitch ID from the URL params
    pitchId = Number(event.context.params?.id)
    if (isNaN(pitchId) || pitchId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'A valid pitch ID is required.',
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

    // Read the request body for updates, treating it as partial Reaction data
    const updates: Partial<Reaction> = await readBody(event)

    // Ensure that reactionType is provided if required for creation
    if (!updates.reactionType) {
      throw createError({
        statusCode: 400,
        message: 'A valid reaction type is required.',
      })
    }

    // Fetch the existing reaction by pitchId and userId
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        pitchId,
        userId,
      },
    })

    // If the reaction exists, update it; otherwise, return a not found error
    if (existingReaction) {
      const updatedReaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: updates,
      })

      return {
        success: true,
        reaction: updatedReaction,
      }
    } else {
      return {
        success: false,
        message: `No reaction found for pitch with ID ${pitchId} and user ID ${userId}.`,
        statusCode: 404,
      }
    }
  } catch (error) {
    console.error(
      `Error updating reaction for pitch ID ${event.context.params?.id}:`,
      error,
    )
    // Use the errorHandler for consistent error handling
    return errorHandler({
      error,
      context: `Updating reaction for pitch ID ${event.context.params?.id}`,
    })
  }
})
