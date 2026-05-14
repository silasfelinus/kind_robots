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

    console.log('[chatgpt parsed request]', JSON.stringify(request, null, 2))
    console.log('[chatgpt actor]', {
      userId: actor?.userId,
      role: actor?.role,
      isGuest: actor?.isGuest,
    })

    switch (request.operation) {
      case 'content.create': {
        console.log('[chatgpt content.create input]', {
          resource: request.resource,
          data: request.data,
          actor,
        })

        const result = await createContent({
          resource: request.resource,
          data: request.data,
          actor,
        })

        console.log('[chatgpt content.create result]', JSON.stringify(result, null, 2))

        return result
      }

      case 'content.get': {
        console.log('[chatgpt content.get input]', {
          resource: request.resource,
          id: request.id,
          actor,
        })

        const result = await getContent({
          resource: request.resource,
          id: request.id,
          actor,
        })

        console.log('[chatgpt content.get result]', JSON.stringify(result, null, 2))

        return result
      }

      case 'content.list': {
        console.log('[chatgpt content.list input]', {
          resource: request.resource,
          filter: request.filter,
          actor,
        })

        const result = await listContent({
          resource: request.resource,
          filter: request.filter,
          actor,
        })

        console.log('[chatgpt content.list result]', JSON.stringify(result, null, 2))

        return result
      }

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

      case 'content.update': {
        console.log('[chatgpt content.update input]', {
          resource: request.resource,
          id: request.id,
          data: request.data,
          actor,
        })

        const result = await updateContent({
          resource: request.resource,
          id: request.id,
          data: request.data,
          actor,
        })

        console.log('[chatgpt content.update result]', JSON.stringify(result, null, 2))

        return result
      }

      case 'content.setActive': {
        console.log('[chatgpt content.setActive input]', {
          resource: request.resource,
          id: request.id,
          isActive: request.isActive,
          actor,
        })

        const result = await setContentActive({
          resource: request.resource,
          id: request.id,
          isActive: request.isActive,
          actor,
        })

        console.log('[chatgpt content.setActive result]', JSON.stringify(result, null, 2))

        return result
      }

      default:
        throw createError({
          statusCode: 400,
          statusMessage: `Operation not implemented yet: ${(request as any).operation}`,
        })
    }
  } catch (error: unknown) {
    console.error('[chatgpt api error]', error)

    if (error instanceof ZodError) {
      console.error('[chatgpt zod issues]', JSON.stringify(error.issues, null, 2))

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