// server/api/reactions/component/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import type { Reaction } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let componentId: number | null = null
  let response

  try {
    // Parse and validate the component ID from the URL params
    componentId = Number(event.context.params?.id)
    if (isNaN(componentId) || componentId <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Component ID is required and must be a valid number.',
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

    // Parse the request body as partial reaction data
    const reactionData: Partial<Reaction> = await readBody(event)

    // Ensure that reactionType is provided in the data
    if (!reactionData || !reactionData.reactionType) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Reaction type is required.',
      })
    }

    // Check if the reaction already exists for this user and component
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        componentId,
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
      // Create a new reaction if none exists
      updatedReaction = await prisma.reaction.create({
        data: {
          componentId,
          userId,
          reactionType: reactionData.reactionType,
          ...reactionData,
        },
      })
    }

    // Consistently wrap the response in a data object
    event.node.res.statusCode = 200
    response = {
      success: true,
      data: { updatedReaction },
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      data: {
        message:
          handledError.message ||
          `Failed to update/create reaction for component with ID ${componentId}.`,
      },
    }
  }

  return response
})
