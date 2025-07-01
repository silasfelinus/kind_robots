// /server/api/hybrids/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id || id <= 0)
    throw createError({ statusCode: 400, message: 'Invalid hybrid ID' })

  try {
    await prisma.hybrid.delete({ where: { id } })

    return {
      success: true,
      message: 'Hybrid deleted successfully.',
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    return {
      success: false,
      message: handled.message,
      statusCode: handled.statusCode || 500,
    }
  }
})
