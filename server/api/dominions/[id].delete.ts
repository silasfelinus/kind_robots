// /server/api/dominions/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

export default defineEventHandler(async (event) => {
  let id: number | null = null
  try {
    id = Number(event.context.params?.id)
    if (!Number.isFinite(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Dominion ID.' })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existing = await prisma.dominion.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: `Dominion ${id} does not exist.`,
      })
    }

    if (user.Role !== 'ADMIN' && existing.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'Not authorized to delete this dominion.',
      })
    }

    await prisma.dominion.delete({ where: { id } })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Dominion ${id} deleted.`,
      statusCode: 200,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || `Failed to delete dominion ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})
