// /server/api/themes/[id].put.ts
import { defineEventHandler, createError, readBody } from 'h3'
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

    const existing = await prisma.theme.findUnique({ where: { id } })
    if (!existing)
      throw createError({ statusCode: 404, message: 'Theme not found' })

    if (user.Role !== 'ADMIN' && user.id !== existing.userId) {
      throw createError({ statusCode: 403, message: 'Forbidden' })
    }

    const body = await readBody(event)
    const updated = await prisma.theme.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        isPublic:
          typeof body.isPublic === 'boolean'
            ? body.isPublic
            : existing.isPublic,
      },
    })

    return { success: true, theme: updated, statusCode: 200 }
  } catch (error) {
    const err = errorHandler(error)
    return { success: false, message: err.message, statusCode: err.statusCode }
  }
})
