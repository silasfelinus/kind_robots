// /server/api/achievements/records/[id].patch.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'
import { requireApiUser } from '../../../utils/authGuard'

function parseConfirmed(body: unknown): boolean {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: 'Achievement record update payload is required.',
    })
  }

  const record = body as Record<string, unknown>
  const unsupportedFields = Object.keys(record).filter(
    (field) => field !== 'isConfirmed',
  )

  if (unsupportedFields.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported Achievement record update fields: ${unsupportedFields.join(', ')}.`,
    })
  }

  if (typeof record.isConfirmed !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: '"isConfirmed" must be a boolean.',
    })
  }

  return record.isConfirmed
}

export default defineEventHandler(async (event) => {
  const recordId = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(recordId) || recordId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Achievement Record ID. It must be a positive integer.',
      })
    }

    const { user, isAdmin } = await requireApiUser(event)

    const existingRecord = await prisma.achievementRecord.findUnique({
      where: { id: recordId },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!existingRecord) {
      throw createError({
        statusCode: 404,
        message: 'Achievement Record not found.',
      })
    }

    if (!isAdmin && existingRecord.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this achievement record.',
      })
    }

    const data = await prisma.achievementRecord.update({
      where: { id: recordId },
      data: {
        isConfirmed: parseConfirmed(await readBody<unknown>(event)),
      },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Achievement record updated successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message:
        handled.message ||
        `Failed to update achievement record with ID ${recordId}.`,
      data: null,
      statusCode,
    }
  }
})
