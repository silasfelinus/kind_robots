// /server/api/themes/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { validateApiKey } from '~/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid theme ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      }) // <- matches test
    }

    const existing = await prisma.theme.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!existing)
      throw createError({ statusCode: 404, message: 'Theme not found.' })
    if (
      existing.userId != null &&
      existing.userId !== user.id &&
      user.Role !== 'ADMIN'
    ) {
      throw createError({
        statusCode: 403,
        message: 'Not authorized to delete this theme.',
      })
    }

    await prisma.theme.delete({ where: { id } })
    event.node.res.statusCode = 200
    return { success: true, message: `Theme ${id} deleted.` }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, message }
  }
})
