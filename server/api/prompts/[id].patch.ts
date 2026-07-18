// /server/api/prompts/[id].patch.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type { Prompt } from '~/prisma/generated/prisma/client'
import { promptResourceSelect } from './selects'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
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

    const updatedPromptData = await readBody<Partial<Prompt>>(event)

    if (!updatedPromptData || Object.keys(updatedPromptData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const existingPrompt = await prisma.prompt.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!existingPrompt) {
      throw createError({
        statusCode: 404,
        message: 'Prompt not found.',
      })
    }

    if (existingPrompt.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this prompt.',
      })
    }

    const data = await prisma.prompt.update({
      where: { id },
      data: updatedPromptData,
      select: promptResourceSelect,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      data,
      message: 'Prompt updated successfully.',
      statusCode: 200,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      data: null,
      message: message || 'Failed to update the prompt.',
      error: message || 'An unknown error occurred',
      statusCode: event.node.res.statusCode,
    }
  }
})
