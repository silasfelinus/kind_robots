// /server/api/code/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Code ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existingCode = await prisma.code.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        isActive: true,
      },
    })

    if (!existingCode || !existingCode.isActive) {
      throw createError({
        statusCode: 404,
        message: 'Code not found.',
      })
    }

    const isOwner = existingCode.userId === user.id
    const isAdmin = user.Role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this Code.',
      })
    }

    const data = await prisma.code.update({
      where: { id },
      data: {
        isActive: false,
      },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Code with ID ${id} successfully deactivated.`,
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    console.error(`[code.delete] Error deleting Code ${id}:`, handled)

    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || `Failed to delete Code with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
