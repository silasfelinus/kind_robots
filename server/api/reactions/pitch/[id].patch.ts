// server/api/reactions/pitch/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  let pitchId: number | null = null
  let response

  try {
    // Parse and validate the pitch ID from the URL params
    pitchId = Number(event.context.params?.id)
    if (isNaN(pitchId) || pitchId <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'A valid pitch ID is required.',
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

    // Read the request body for updates, treating it as partial Reaction data
    const updates: Partial<Reaction> = await readBody(event)

    // Ensure that reactionType is provided if required for creation
    if (!updates.reactionType) {
      event.node.res.statusCode = 400
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

    let updatedReaction

    // If the reaction exists, update it
    if (existingReaction) {
      updatedReaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: updates,
      })

      response = {
        success: true,
        reaction: updatedReaction,
        statusCode: 200,
      }
      event.node.res.statusCode = 200
    } else {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `No reaction found for pitch with ID ${pitchId} and user ID ${userId}.`,
      })
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to update reaction for pitch with ID ${pitchId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
