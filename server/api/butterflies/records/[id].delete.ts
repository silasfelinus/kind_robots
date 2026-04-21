// /server/api/butterfly/records/[id].delete.ts
// Allows a user to release a butterfly from their collection.
// Useful for testing and future "release" feature.
// Users can only delete their own records; admins can delete any.

import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  let id: number = 0
  let response

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid butterfly record ID. Must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const record = await prisma.butterflyRecord.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!record) {
      throw createError({
        statusCode: 404,
        message: `Butterfly record with ID ${id} not found.`,
      })
    }

    if (record.userId !== user.id && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to delete this butterfly record.',
      })
    }

    await prisma.butterflyRecord.delete({ where: { id } })

    response = {
      success: true,
      message: `Butterfly record with ID ${id} deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handled = errorHandler(error)
    console.error('[butterfly-record.id.delete] Error:', handled)
    event.node.res.statusCode = handled.statusCode || 500
    response = {
      success: false,
      message:
        handled.message || `Failed to delete butterfly record with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
