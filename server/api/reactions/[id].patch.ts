// /server/api/reactions/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const reactionId = Number(event.context.params?.id)
    if (!reactionId) {
      throw new Error('Missing or invalid reaction ID.')
    }

    const requestData = await readBody(event)

    const {
      reaction,
      title,
      comment,
      isLoved,
      isClapped,
      isBooed,
      isHated,
    } = requestData

    // Fetch the existing reaction to ensure it exists
    const existingReaction = await prisma.reaction.findUnique({
      where: { id: reactionId },
    })

    if (!existingReaction) {
      return {
        success: false,
        message: 'Reaction not found.',
        statusCode: 404,
      }
    }

    // Update the reaction in the database
    const updatedReaction = await prisma.reaction.update({
      where: { id: reactionId },
      data: {
        reaction,
        title,
        comment,
        isLoved,
        isClapped,
        isBooed,
        isHated,
      },
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
