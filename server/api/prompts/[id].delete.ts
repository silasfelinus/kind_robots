// /server/api/prompts/[id].delete.ts
import { createError, defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { userIsAdmin } from '../../utils/authUser'

export default defineEventHandler(async (event) => {
  let promptId: number | null = null

  try {
    promptId = Number(event.context.params?.id)

    if (!Number.isInteger(promptId) || promptId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid prompt ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!prompt) {
      throw createError({
        statusCode: 404,
        message: `Prompt with ID ${promptId} does not exist.`,
      })
    }

    if (prompt.userId !== user.id && !userIsAdmin(user)) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this prompt.',
      })
    }

    await prisma.prompt.delete({ where: { id: promptId } })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Prompt with ID ${promptId} successfully deleted.`,
      data: null,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    if (statusCode >= 500) {
      console.error('Prompt delete failed:', handled)
    }

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message:
        handled.message || `Failed to delete prompt with ID ${promptId}.`,
      data: null,
      statusCode,
    }
  }
})
