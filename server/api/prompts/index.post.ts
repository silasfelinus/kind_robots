// /server/api/prompts/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type { Prompt } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id
    const promptData = await readBody<
      Partial<Prompt> & { CreationSource?: string }
    >(event)

    if (!promptData.prompt || typeof promptData.prompt !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'The "prompt" field is required and must be a string.',
      })
    }

    if (promptData.userId && promptData.userId !== authenticatedUserId) {
      throw createError({
        statusCode: 403,
        message: 'User ID does not match the authenticated user.',
      })
    }

    // Resolve creationSource from either casing the client might send
    const resolvedSource = (promptData.creationSource ??
      promptData.CreationSource ??
      'UNKNOWN') as string

    const data = await prisma.prompt.create({
      data: {
        prompt: promptData.prompt,
        creationSource: resolvedSource as any,
        User: { connect: { id: authenticatedUserId } },
        ...(promptData.pitchId && {
          Pitch: { connect: { id: promptData.pitchId } },
        }),
        ...(promptData.botId && { Bot: { connect: { id: promptData.botId } } }),
      },
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      data,
      message: 'Prompt created successfully.',
    }
  } catch (error: unknown) {
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
