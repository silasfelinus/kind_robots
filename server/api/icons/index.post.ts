// /server/api/icons/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import {
  buildSmartIconCreateInput,
  findExistingSmartIcon,
  type SmartIconCreateBody,
} from './create'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<SmartIconCreateBody | SmartIconCreateBody[]>(event)

    if (Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message:
          'POST /api/icons creates one SmartIcon. Use /api/icons/batch for arrays.',
      })
    }

    if (!body || typeof body !== 'object') {
      throw createError({
        statusCode: 400,
        message: 'SmartIcon data is required.',
      })
    }

    const data = buildSmartIconCreateInput(body, user.id)
    const existing = await findExistingSmartIcon({
      title: data.title,
      type: data.type,
      userId: user.id,
    })

    if (existing) {
      throw createError({
        statusCode: 409,
        message: `SmartIcon already exists with ID ${existing.id}.`,
      })
    }

    const icon = await prisma.smartIcon.create({ data })

    event.node.res.statusCode = 201

    return {
      success: true,
      data: icon,
      message: 'SmartIcon created successfully.',
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      data: null,
      message: handled.message || 'Failed to create SmartIcon.',
      statusCode,
    }
  }
})
