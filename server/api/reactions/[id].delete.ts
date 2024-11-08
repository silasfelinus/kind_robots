import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const reactionId = Number(event.context.params?.id)

  try {
    // Validate Reaction ID
    if (isNaN(reactionId) || reactionId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid reaction ID. It must be a positive integer.',
      })
    }

    // Authenticate API key
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // Check Reaction existence and ownership
    const reaction = await prisma.reaction.findUnique({
      where: { id: reactionId },
      select: { userId: true },
    })

    if (!reaction) {
      throw createError({
        statusCode: 404,
        message: `Reaction with ID ${reactionId} does not exist.`,
      })
    }

    if (reaction.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this reaction.',
      })
    }

    // Delete the reaction
    await prisma.reaction.delete({ where: { id: reactionId } })

    // Successful deletion response
    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Reaction with ID ${reactionId} successfully deleted.`,
      data: [],
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message:
        handledError.message ||
        `Failed to delete reaction with ID ${reactionId}.`,
      data: [],
    }
  }
})
