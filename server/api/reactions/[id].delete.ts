// /server/api/reactions/[id].delete.ts
import { createError, defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { userIsAdmin } from '../../utils/authUser'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const reactionId = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(reactionId) || reactionId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid reaction ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

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

    if (reaction.userId !== user.id && !userIsAdmin(user)) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this reaction.',
      })
    }

    await prisma.reaction.delete({ where: { id: reactionId } })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Reaction with ID ${reactionId} successfully deleted.`,
      data: null,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message:
        handled.message || `Failed to delete reaction with ID ${reactionId}.`,
      data: null,
      statusCode,
    }
  }
})
