import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prompt, Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Validate authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
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
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id

    // Read and validate the prompt data from the request body
    const promptData = (await readBody(event)) as Partial<Prompt>

    // Ensure the "prompt" field is provided and is a string
    if (!promptData.prompt || typeof promptData.prompt !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'The "prompt" field is required and must be a string.',
      })
    }

    // Verify that if userId is provided, it matches the authenticated user
    if (promptData.userId && promptData.userId !== authenticatedUserId) {
      throw createError({
        statusCode: 403,
        message: 'User ID does not match the authenticated user.',
      })
    }

    // Create the new prompt with the authenticated user ID
    const newPrompt = await prisma.prompt.create({
      data: {
        userId: authenticatedUserId,
        prompt: promptData.prompt,
        galleryId: promptData.galleryId || null,
        pitchId: promptData.pitchId || null,
        botId: promptData.botId || null,
      } as Prisma.PromptCreateInput,
    })

    // Set status code to 201 Created for successful creation
    event.node.res.statusCode = 201
    return { success: true, newPrompt }
  } catch (error: unknown) {
    // Capture specific error message and status code from errorHandler
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message,
      statusCode,
    }
  }
})
