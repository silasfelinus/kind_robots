// /server/api/prompts/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Prompt, Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Use validateApiKey for token authentication
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id

    // Read and validate the prompt data from the request body
    const promptData = await readBody<Partial<Prompt>>(event)

    // Ensure "prompt" is provided and is a string
    if (!promptData.prompt || typeof promptData.prompt !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'The "prompt" field is required and must be a string.',
      })
    }

    // Check if userId in the promptData matches the authenticated user (if provided)
    if (promptData.userId && promptData.userId !== authenticatedUserId) {
      throw createError({
        statusCode: 403,
        message: 'User ID does not match the authenticated user.',
      })
    }

    // Create the prompt with the authenticated user ID
    const data = await prisma.prompt.create({
      data: {
        userId: authenticatedUserId,
        prompt: promptData.prompt,
        galleryId: promptData.galleryId || null,
        pitchId: promptData.pitchId || null,
        botId: promptData.botId || null,
      } as Prisma.PromptCreateInput,
    })

    // Return success response with appropriate status code
    event.node.res.statusCode = 201
    return {
      success: true,
      data,
      message: 'Prompt created successfully.',
    }
  } catch (error: unknown) {
    // Capture specific error message and status code from errorHandler
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message,
      error: message,
      statusCode,
    }
  }
})
