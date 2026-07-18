// /server/api/resources/batch.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import {
  buildResourceCreateInput,
  fallbackResourceName,
  isResourceDuplicateError,
  isResourceInfrastructureError,
  type ResourceBatchFailure,
  type ResourceBatchSkip,
  type ResourceCreateBody,
} from './create'
import {
  resourceMutationSelect,
  type ResourceMutationResult,
} from './selects'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user, kind } = await validateApiKey(event)

    if (!isValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<ResourceCreateBody[]>(event)

    if (!Array.isArray(body) || !body.length) {
      throw createError({
        statusCode: 400,
        message: 'Resource batch body must be a non-empty array.',
      })
    }

    const isServerKey = kind === 'server'
    const isAdmin = user?.Role === 'ADMIN' || user?.id === 1
    const fallbackUserId = user?.id || 1
    const canAssignUserId = isAdmin || isServerKey
    const created: ResourceMutationResult[] = []
    const skipped: ResourceBatchSkip[] = []
    const failed: ResourceBatchFailure[] = []

    for (const entry of body) {
      const fallbackName = fallbackResourceName(entry)

      try {
        const data = await buildResourceCreateInput({
          entry,
          fallbackUserId,
          canAssignUserId,
        })

        try {
          const resource = await prisma.resource.create({
            data,
            select: resourceMutationSelect,
          })

          created.push(resource)
        } catch (error) {
          if (isResourceDuplicateError(error)) {
            skipped.push({
              name: data.name,
              reason: 'Resource with this unique identity already exists.',
            })
            continue
          }

          throw error
        }
      } catch (error) {
        if (isResourceInfrastructureError(error)) throw error

        const handled = errorHandler(error)
        failed.push({
          name: fallbackName,
          message: handled.message || 'Invalid Resource payload.',
        })
      }
    }

    if (!created.length && !skipped.length && failed.length) {
      event.node.res.statusCode = 400

      return {
        success: false,
        message: `No resources were created. ${failed.length} failed.`,
        data: { created, skipped, failed },
        statusCode: 400,
      }
    }

    const statusCode = failed.length ? 207 : created.length ? 201 : 200
    event.node.res.statusCode = statusCode

    return {
      success: created.length > 0 || failed.length === 0,
      message: `${created.length} created, ${skipped.length} skipped, ${failed.length} failed.`,
      data: { created, skipped, failed },
      statusCode,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to batch-create resources.',
      data: null,
      statusCode,
    }
  }
})
