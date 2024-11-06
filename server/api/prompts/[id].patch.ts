// /server/api/art/prompts/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import type { Prompt } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { updatePrompt } from './artQueries'

export default defineEventHandler(async (event) => {
  let id: number | null = null
  let response

  try {
    // Parse and validate the prompt ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid prompt ID.',
      })
    }

    // Extract and validate the API key directly from the request headers
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
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
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Parse the incoming request body as partial prompt data
    const updatedPromptData: Partial<Prompt> = await readBody(event)
    if (!updatedPromptData || Object.keys(updatedPromptData).length === 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Fetch the existing prompt to verify ownership
    const existingPrompt = await prisma.prompt.findUnique({ where: { id } })
    if (!existingPrompt) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: 'Prompt not found.',
      })
    }

    // Verify ownership of the prompt
    if (existingPrompt.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this prompt.',
      })
    }

    // Update the prompt in the database
    const updatedPrompt = await updatePrompt(id, updatedPromptData)

    // Success response with data object wrapping
    response = {
      success: true,
      data: { updatedPrompt },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to update prompt with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
