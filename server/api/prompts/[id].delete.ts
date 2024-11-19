// /server/api/prompts/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const promptId = Number(event.context.params?.id)

  try {
    // Validate Prompt ID
    if (isNaN(promptId) || promptId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Prompt ID. It must be a positive integer.',
      })
    }

    // Authenticate API Key
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const userId = user.id

    // Validate Prompt Existence and Ownership
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: { userId: true },
    })

    if (!prompt) {
      throw createError({
        statusCode: 404,
        message: `Prompt with ID ${promptId} does not exist.`,
      })
    }

// Check if user is an admin
    if (user.Role === 'ADMIN') {
      // Admin bypass: Delete the prompt entry directly
      await prisma.prompt.delete({ where: { promptId } })
      return {
        success: true,
        message: `Prompt entry with ID ${promptId} deleted successfully by admin.`,
      }
    }

    if (prompt.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this prompt.',
      })
    }

    // Perform Deletion
    await prisma.prompt.delete({ where: { id: promptId } })

    // Successful deletion response
    event.node.res.setHeader('Content-Type', 'application/json')
    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Prompt with ID ${promptId} successfully deleted.`,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error deleting prompt:', handledError)

    // Set the response and status code based on the handled error
    event.node.res.setHeader('Content-Type', 'application/json')
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message:
        handledError.message || `Failed to delete prompt with ID ${promptId}.`,
    }
  }
})
