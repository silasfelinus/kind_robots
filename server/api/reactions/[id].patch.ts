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

    const { comment, reactionType, reactionCategory } = requestData

    // Ensure the required fields are provided
    if (!reactionType || !reactionCategory) {
      return {
        success: false,
        message: 'Reaction type and category are required.',
        statusCode: 400,
      }
    }

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
        comment,
        reactionType, // Updating the reactionType field
        reactionCategory: reactionCategory, // Updating the reactionCategory field
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
