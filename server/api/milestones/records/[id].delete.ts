// server/api/users/milestones/records/[id].delete.ts
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
        message: 'Milestone Record ID must be a positive integer.',
      })
    }

    const { user, isAdmin } = await requireApiUser(event)

    const milestoneRecord = await prisma.milestoneRecord.findUnique({
      where: { id: recordId },
    })

    if (!milestoneRecord) {
      throw createError({
        statusCode: 404,
        message: `Milestone Record with ID ${recordId} does not exist.`,
      })
    }

    if (!isAdmin && milestoneRecord.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to delete this milestone record.',
      })
    }

    await prisma.milestoneRecord.delete({
      where: { id: recordId },
    })

    response = {
      success: true,
      message: `Milestone Record with ID ${recordId} successfully deleted.`,
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
        `Failed to delete Milestone Record with ID ${recordId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
