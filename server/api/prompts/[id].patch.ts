// /server/api/art/prompts/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import type { Prompt } from '@prisma/client'
import { errorHandler } from '../utils/error'
import { verifyJwtToken } from '../auth'
import { updatePrompt } from './artQueries'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Parse and validate the prompt ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid prompt ID.',
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

    // Parse the incoming request body as partial prompt data
    const updatedPromptData: Partial<Prompt> = await readBody(event)
    if (!updatedPromptData || Object.keys(updatedPromptData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Fetch the existing prompt to verify ownership
    const existingPrompt = await prisma.prompt.findUnique({ where: { id } })
    if (!existingPrompt) {
      throw createError({
        statusCode: 404,
        message: 'Prompt not found.',
      })
    }

    // Verify ownership of the prompt
    if (existingPrompt.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this prompt.',
      })
    }

    // Update the prompt in the database
    const updatedPrompt = await updatePrompt(id, updatedPromptData)

    // Return the updated prompt
    return { success: true, updatedPrompt }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message: handledError.message || `Failed to update prompt with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
