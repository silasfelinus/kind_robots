// /server/api/icons/[id].patch.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import {
  buildSmartIconUpdateInput,
  findExistingSmartIcon,
  hasSmartIconUpdate,
} from './create'

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid SmartIcon ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existingIcon = await prisma.smartIcon.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        type: true,
        category: true,
        modelType: true,
      },
    })

    if (!existingIcon) {
      throw createError({
        statusCode: 404,
        message: 'SmartIcon not found.',
      })
    }

    if (existingIcon.userId !== user.id && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this SmartIcon.',
      })
    }

    const body = await readBody<Record<string, unknown>>(event)
    const data = buildSmartIconUpdateInput(body ?? {}, existingIcon)

    if (!hasSmartIconUpdate(data)) {
      throw createError({
        statusCode: 400,
        message: 'No valid data provided for update.',
      })
    }

    const nextTitle =
      typeof data.title === 'string' ? data.title : existingIcon.title
    const nextType = typeof data.type === 'string' ? data.type : existingIcon.type
    const duplicate = await findExistingSmartIcon({
      title: nextTitle,
      type: nextType,
      userId: existingIcon.userId ?? user.id,
      excludeId: id,
    })

    if (duplicate) {
      throw createError({
        statusCode: 409,
        message: `SmartIcon already exists with ID ${duplicate.id}.`,
      })
    }

    const updated = await prisma.smartIcon.update({
      where: { id },
      data,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'SmartIcon updated successfully.',
      data: updated,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || `Failed to update SmartIcon with ID ${id}.`,
      data: null,
      statusCode,
    }
  }
})
