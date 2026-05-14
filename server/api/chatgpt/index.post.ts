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

      case 'meta.describe':
        return {
          ok: true,
          operation: 'meta.describe',
          message: 'Kind Robots ChatGPT API capabilities.',
          implementedOperations: [
            'content.create',
            'content.get',
            'content.list',
            'content.update',
            'content.setActive',
            'meta.describe',
          ],
          implementedResources: ['character', 'dream', 'artImage'],
          defaults: {
            isPublic: true,
            isMature: false,
            isActive: true,
            defaultGuestUserId: 10,
          },
          requestShapes: {
            create: {
              operation: 'content.create',
              resource: 'character',
              data: {
                name: 'Example Character',
                isPublic: true,
                isMature: false,
                isActive: true,
              },
            },
            update: {
              operation: 'content.update',
              resource: 'character',
              id: 1,
              data: {
                name: 'Updated Character Name',
              },
            },
            list: {
              operation: 'content.list',
              resource: 'character',
              filter: {
                isActive: true,
                limit: 20,
              },
            },
            archive: {
              operation: 'content.setActive',
              resource: 'character',
              id: 1,
              isActive: false,
            },
          },
          notes: [
            'For content.create and content.update, all record fields must be inside the top-level data object.',
            'Records are never hard-deleted; use content.setActive with isActive:false to archive.',
          ],
        }

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
