import { defineEventHandler, readBody } from 'h3'
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
  const actor = await resolveChatGptActor(event)
  const body = await readBody(event)
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
        statusMessage: `Operation not implemented yet: ${request.operation}`,
      })
  }
})
