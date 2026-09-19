import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid archive entry id.',
      })
    }

    const entry = await prisma.archiveEntry.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!entry) {
      throw createError({
        statusCode: 404,
        message: `Archive entry #${id} not found.`,
      })
    }

    const updated = await prisma.archiveEntry.update({
      where: { id },
      data: { matchState: 'AMBIGUOUS' },
      select: { id: true, matchState: true },
    })

    return {
      success: true,
      message: `Archive entry #${id} marked for match review.`,
      data: updated,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to mark archive entry for review.',
      statusCode,
    }
  }
})
