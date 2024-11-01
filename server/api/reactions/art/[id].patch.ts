// server/api/reactions/art/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  let artId: number | null = null
  let response

  try {
    // Extract and validate the art ID from the URL params
    artId = Number(event.context.params?.id)
    if (isNaN(artId) || artId <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Art ID is required and must be a valid number.',
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

    // Parse the request body to get the reaction data
    const body = await readBody(event)
    const { reactionType } = body

    // Ensure that reactionType is provided
    if (!reactionType) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Reaction type is required.',
      })
    }

    // Check if the reaction already exists for this user and art
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        artId,
        userId,
      },
    })

    let updatedReaction

    if (existingReaction) {
      // Update the existing reaction
      updatedReaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: { reactionType },
      })
    } else {
      // Create a new reaction if none exists
      updatedReaction = await prisma.reaction.create({
        data: {
          artId,
          userId,
          reactionType,
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
        `Failed to update/create reaction for art with ID ${artId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
