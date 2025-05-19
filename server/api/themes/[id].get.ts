import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (isNaN(id) || id <= 0)
    throw createError({ statusCode: 400, message: 'Invalid ID' })

  try {
    const data = await prisma.theme.findUnique({ where: { id } })
    if (!data)
      throw createError({ statusCode: 404, message: 'Theme not found' })
    return { success: true, data, statusCode: 200 }
  } catch (error) {
    const err = errorHandler(error)
    return { success: false, message: err.message, statusCode: err.statusCode }
  }
})
