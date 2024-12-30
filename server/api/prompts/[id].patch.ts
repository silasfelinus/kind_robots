// /server/api/art/prompts/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Prompt } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate the prompt ID from the URL params
    const id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid prompt ID. It must be a positive integer.',
      })
    }

    // Authenticate the user
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // Parse the incoming request body as partial prompt data
    const updatedPromptData: Partial<Prompt> = await readBody(event)
    if (!updatedPromptData || Object.keys(updatedPromptData).length === 0) {
      event.node.res.statusCode = 400
      return {
        success: false,
        message: 'No data provided for update.',
      }
    }

    // Fetch the existing prompt to verify ownership
    const existingPrompt = await prisma.prompt.findUnique({ where: { id } })
    if (!existingPrompt) {
      event.node.res.statusCode = 404
      return {
        success: false,
        message: 'Prompt not found.',
      }
    }

    // Verify ownership of the prompt
    if (existingPrompt.userId !== user.id) {
      event.node.res.statusCode = 403
      return {
        success: false,
        message: 'You do not have permission to update this prompt.',
      }
    }

    // Update the prompt in the database
    const data = await prisma.prompt.update({
      where: { id },
      data: updatedPromptData,
    })

    // Set status code for successful update
    event.node.res.statusCode = 200
    return {
      success: true,
      data,
      message: 'Prompt updated successfully.',
    }
  } catch (error) {
    // Handle the error using the error handler
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to update the prompt.',
      error: message || 'An unknown error occurred',
    }
  }
})
