// /server/api/achievements/records.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { requireApiUser } from '../../utils/authGuard'

function parseAchievementId(body: unknown): number {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: 'Achievement record payload is required.',
    })
  }

  const record = body as Record<string, unknown>
  const unsupportedFields = Object.keys(record).filter(
    (field) => field !== 'achievementId',
  )

  if (unsupportedFields.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported Achievement record fields: ${unsupportedFields.join(', ')}. User identity comes from authentication.`,
    })
  }

  const achievementId = Number(record.achievementId)

  if (!Number.isInteger(achievementId) || achievementId <= 0) {
    throw createError({
      statusCode: 400,
      message: '"achievementId" must be a positive integer.',
    })
  }

  return achievementId
}

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const achievementId = parseAchievementId(await readBody<unknown>(event))

    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { id: true },
    })

    if (!achievement) {
      throw createError({
        statusCode: 404,
        message: `Achievement ID not found: ${achievementId}.`,
      })
    }

    const existingRecord = await prisma.achievementRecord.findFirst({
      where: {
        achievementId,
        userId: user.id,
      },
    })

    if (existingRecord) {
      event.node.res.statusCode = 200

      return {
        success: true,
        message: 'Achievement was already recorded for this user.',
        data: existingRecord,
        statusCode: 200,
      }
    }

    const data = await prisma.achievementRecord.create({
      data: {
        achievementId,
        userId: user.id,
        username: user.username || user.name || `user-${user.id}`,
      },
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Achievement record created successfully.',
      data,
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to create achievement record.',
      data: null,
      statusCode,
    }
  }
})
