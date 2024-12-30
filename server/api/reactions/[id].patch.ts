// /server/api/reactions/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Reaction } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const reactionId = Number(event.context.params?.id)

  try {
    // Validate the Reaction ID
    if (isNaN(reactionId) || reactionId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid reaction ID. It must be a positive integer.',
      })
    }

    // Use validateApiKey for authentication
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Parse and validate the request body data
    const requestData: Partial<Reaction> = await readBody(event)
    const { reactionType, reactionCategory } = requestData

    // Check for required fields
    if (!reactionType || !reactionCategory) {
      throw createError({
        statusCode: 400,
        message: 'Reaction type and category are required fields.',
      })
    }

    // Fetch the existing reaction to validate existence and ownership
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

    // Perform the update operation
    const data = await prisma.reaction.update({
      where: { id: reactionId },
      data: requestData,
    })

    // Return success response
    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Reaction updated successfully.',
      data,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || `Failed to update reaction with ID ${reactionId}.`,
      data: null,
    }
  }
})
