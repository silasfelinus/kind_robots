// /server/api/themes/[id].get.ts
import { createError, defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { parseTheme } from '@/server/api/themes/index'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid theme ID.' })
    }

    const row = await prisma.theme.findUnique({ where: { id } })

    if (!row) {
      throw createError({ statusCode: 404, message: 'Theme not found.' })
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Theme retrieved successfully.',
      data: parseTheme(row),
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to retrieve theme.',
      data: null,
      statusCode,
    }
  }
})
