// /server/api/resources/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import {
  buildResourceCreateInput,
  isResourceDuplicateError,
  type ResourceCreateBody,
} from './create'
import { resourceMutationSelect } from './selects'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user, kind } = await validateApiKey(event)

    if (!isValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<ResourceCreateBody | ResourceCreateBody[]>(event)

    if (Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message:
          'POST /api/resources creates one Resource. Use /api/resources/batch for arrays.',
      })
    }

    if (!body || typeof body !== 'object') {
      throw createError({
        statusCode: 400,
        message: 'Resource data is required.',
      })
    }

    const isServerKey = kind === 'server'
    const isAdmin = user?.Role === 'ADMIN' || user?.id === 1
    const data = await buildResourceCreateInput({
      entry: body,
      fallbackUserId: user?.id || 1,
      canAssignUserId: isAdmin || isServerKey,
    })

    try {
      const resource = await prisma.resource.create({
        data,
        select: resourceMutationSelect,
      })

      event.node.res.statusCode = 201

      return {
        success: true,
        message: 'Resource created successfully.',
        data: resource,
        statusCode: 201,
      }
    } catch (error) {
      if (isResourceDuplicateError(error)) {
        throw createError({
          statusCode: 409,
          message: `Resource "${data.name}" already exists.`,
        })
      }

      throw error
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to create resource.',
      data: null,
      statusCode,
    }
  }
})
