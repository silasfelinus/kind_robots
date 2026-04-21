// /server/api/butterflies/[id].patch.ts
// Admin-only. name and message should be treated as immutable after seeding,
// but this endpoint exists for corrections.

import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { Prisma } from '~/prisma/generated/prisma/client'

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
        message: 'Only admins can update butterfly species.',
      })
    }

    const existing = await prisma.butterfly.findUnique({ where: { id } })
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: `Butterfly with ID ${id} not found.`,
      })
    }

    const body: Prisma.ButterflyUpdateInput = await readBody(event)
    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const data = await prisma.butterfly.update({ where: { id }, data: body })

    response = {
      success: true,
      message: 'Butterfly updated successfully.',
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handled = errorHandler(error)
    console.error('[butterfly.id.patch] Error:', handled)
    event.node.res.statusCode = handled.statusCode || 500
    response = {
      success: false,
      message: handled.message || `Failed to update butterfly with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
