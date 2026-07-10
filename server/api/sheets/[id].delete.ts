// /server/api/sheets/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid PitchSheet ID. Must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existing = await prisma.pitchSheet.findUnique({
      where: { id },
      include: { Dream: true, Project: true },
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'PitchSheet not found.',
      })
    }

    const isOwner =
      existing.userId === user.id ||
      existing.Dream?.userId === user.id ||
      existing.Project?.userId === user.id
    if (user.Role !== 'ADMIN' && !isOwner) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this PitchSheet.',
      })
    }

    const deleted = await prisma.pitchSheet.delete({
      where: { id },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `PitchSheet with ID ${id} successfully deleted.`,
      data: deleted,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || `Failed to delete PitchSheet with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
