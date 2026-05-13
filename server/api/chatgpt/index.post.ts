import { defineEventHandler, readBody, createError } from 'h3'
import { ZodError } from 'zod'
import { resolveChatGptActor } from '~/server/chatgpt/auth/resolveActor'
import { ChatGptOperationSchema } from '~/server/chatgpt/schemas/operationSchemas'
import {
  createContent,
  getContent,
  listContent,
  updateContent,
  setContentActive,
} from '~/server/chatgpt/services/contentService'

export default defineEventHandler(async (event) => {
  try {
    const actor = await resolveChatGptActor(event)
    const body = await readBody(event)

    console.log('[chatgpt raw body]', JSON.stringify(body, null, 2))

    const request = ChatGptOperationSchema.parse(body)

    switch (request.operation) {
      case 'content.create':
        return createContent({
          resource: request.resource,
          data: request.data,
          actor,
        })

      case 'content.get':
        return getContent({
          resource: request.resource,
          id: request.id,
          actor,
        })

      case 'content.list':
        return listContent({
          resource: request.resource,
          filter: request.filter,
          actor,
        })

      case 'content.update':
        return updateContent({
          resource: request.resource,
          id: request.id,
          data: request.data,
          actor,
        })

      case 'content.setActive':
        return setContentActive({
          resource: request.resource,
          id: request.id,
          isActive: request.isActive,
          actor,
        })

      default:
        throw createError({
          statusCode: 400,
          statusMessage: `Operation not implemented yet: ${(request as any).operation}`,
        })
    }
  } catch (error: unknown) {
    console.error('[chatgpt api error]', error)

    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid ChatGPT operation request',
        data: {
          issues: error.issues,
        },
      })
    }

    throw error
  }
})
