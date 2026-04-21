// /server/api/butterflies/[id].delete.ts
// Admin-only. Deleting a species also cascades to all ButterflyRecords for it.

import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  let id: number
  let response

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid butterfly ID. Must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    if (user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'Only admins can delete butterfly species.',
      })
    }

    const existing = await prisma.butterfly.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: `Butterfly with ID ${id} not found.`,
      })
    }

    await prisma.butterfly.delete({ where: { id } })

    response = {
      success: true,
      message: `Butterfly with ID ${id} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handled = errorHandler(error)
    console.error('[butterfly.id.delete] Error:', handled)
    event.node.res.statusCode = handled.statusCode || 500
    response = {
      success: false,
      message: handled.message || `Failed to delete butterfly with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
