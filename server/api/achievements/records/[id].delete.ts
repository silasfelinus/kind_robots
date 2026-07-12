// server/api/users/achievements/records/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'

export default defineEventHandler(async (event) => {
  let response
  let recordId: number | null = null

  try {
    recordId = Number(event.context.params?.id)

    if (Number.isNaN(recordId) || recordId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Achievement Record ID must be a positive integer.',
      })
    }

    const { user, isAdmin } = await requireApiUser(event)

    const achievementRecord = await prisma.achievementRecord.findUnique({
      where: { id: recordId },
    })

    if (!achievementRecord) {
      throw createError({
        statusCode: 404,
        message: `Achievement Record with ID ${recordId} does not exist.`,
      })
    }

    if (!isAdmin && achievementRecord.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to delete this achievement record.',
      })
    }

    await prisma.achievementRecord.delete({
      where: { id: recordId },
    })

    response = {
      success: true,
      message: `Achievement Record with ID ${recordId} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to delete Achievement Record with ID ${recordId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
