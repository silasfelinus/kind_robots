// server/api/reactions/art/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { verifyJwtToken } from '../../auth'

export default defineEventHandler(async (event) => {
  let artId: number | null = null

  try {
    // Extract and validate the art ID from the URL params
    artId = Number(event.context.params?.id)
    if (isNaN(artId) || artId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Art ID is required and must be a valid number.',
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

    // Parse the request body to get the reaction data
    const body = await readBody(event)
    const { reactionType } = body

    // Ensure that reactionType is provided
    if (!reactionType) {
      throw createError({
        statusCode: 400,
        message: 'Reaction type is required.',
      })
    }

    const userId = verificationResult.userId // Use the user ID from the validated token

    // Check if the reaction already exists for this user and art
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        artId,
        userId,
      },
    })

    let updatedReaction

    if (existingReaction) {
      // If the reaction exists, update it
      updatedReaction = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: { reactionType },
      })
    } else {
      // If no reaction exists, create a new one
      updatedReaction = await prisma.reaction.create({
        data: {
          artId,
          userId,
          reactionType,
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
        `Failed to update/create reaction for art with ID ${artId}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
