// /server/api/themes/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'
import { validateApiKey } from '@/server/api/utils/validateKey'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (isNaN(id) || id <= 0)
    throw createError({ statusCode: 400, message: 'Invalid ID' })

  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user)
      throw createError({ statusCode: 401, message: 'Unauthorized' })

    const theme = await prisma.theme.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!theme)
      throw createError({ statusCode: 404, message: 'Theme not found' })

    if (user.Role === 'ADMIN' || theme.userId === user.id) {
      await prisma.theme.delete({ where: { id } })
      return { success: true, message: 'Theme deleted', statusCode: 200 }
    } else {
      throw createError({
        statusCode: 403,
        message: 'Not authorized to delete this theme',
      })
    }
  } catch (error) {
    const err = errorHandler(error)
    return { success: false, message: err.message, statusCode: err.statusCode }
  }
})
