// /server/api/themes/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'
import { parseTheme } from '@/server/api/themes/index'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid theme ID.' })
    }

    const row = await prisma.theme.findUnique({ where: { id } })
    if (!row)
      throw createError({ statusCode: 404, message: 'Theme not found.' })

    event.node.res.statusCode = 200
    return { success: true, data: parseTheme(row) }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, message }
  }
})
