// /server/api/server/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Server ID. Must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const item = await prisma.server.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        isOfficial: true,
        isDefault: true,
      },
    })

    if (!item) {
      throw createError({
        statusCode: 404,
        message: `Server with ID ${id} not found.`,
      })
    }

    const isAdmin = user.Role === 'ADMIN'
    if ((item.isOfficial || item.isDefault) && !isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'Only admins can delete official or default Servers.',
      })
    }

    if (item.userId !== user.id && !isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to delete this Server.',
      })
    }

    await prisma.server.delete({ where: { id } })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Server with ID ${id} successfully deleted.`,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    console.error('[server.delete] Error:', handled)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || `Failed to delete Server with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})
