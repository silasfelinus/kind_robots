// /server/api/achievements/records/[id].patch.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'
import { requireApiUser } from '../../../utils/authGuard'
import { awardKarma } from '../../../utils/karma'
import { applyMana } from '../../../utils/mana'

const ACHIEVEMENT_MANA_REWARD = 1

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

    const isConfirmed = parseConfirmed(await readBody<unknown>(event))
    const { user, isAdmin } = await requireApiUser(event)

    const result = await prisma.$transaction(async (tx) => {
      const lockedRecords = await tx.$queryRaw<Array<{ id: number }>>`
        SELECT id
        FROM \`AchievementRecord\`
        WHERE id = ${recordId}
        FOR UPDATE
      `

      if (!lockedRecords.length) {
        throw createError({
          statusCode: 404,
          message: 'Achievement Record not found.',
        })
      }

      const existingRecord = await tx.achievementRecord.findUnique({
        where: { id: recordId },
        select: {
          id: true,
          userId: true,
          achievementId: true,
          Achievement: {
            select: {
              karma: true,
              label: true,
            },
          },
        },
      })

      if (!existingRecord) {
        throw createError({
          statusCode: 404,
          message: 'Achievement Record not found after locking.',
        })
      }

      if (!isAdmin && existingRecord.userId !== user.id) {
        throw createError({
          statusCode: 403,
          message: 'You do not have permission to update this achievement record.',
        })
      }

      const data = await tx.achievementRecord.update({
        where: { id: recordId },
        data: { isConfirmed },
      })

      if (!isConfirmed) {
        return {
          data,
          reward: {
            granted: false,
            karma: 0,
            mana: 0,
          },
        }
      }

      const refId = String(existingRecord.id)
      const note = `Achievement confirmed: ${existingRecord.Achievement.label}`
      const [existingKarmaAward, existingManaAward] = await Promise.all([
        tx.karmaTransaction.findFirst({
          where: {
            userId: existingRecord.userId,
            reason: 'ACHIEVEMENT_CONFIRMED',
            refId,
          },
          select: { id: true },
        }),
        tx.manaTransaction.findFirst({
          where: {
            userId: existingRecord.userId,
            reason: 'ACHIEVEMENT_CONFIRMED',
            refId,
          },
          select: { id: true },
        }),
      ])

      const karmaAward = existingKarmaAward
        ? null
        : await awardKarma({
            userId: existingRecord.userId,
            reason: 'ACHIEVEMENT_CONFIRMED',
            amount: existingRecord.Achievement.karma,
            refId,
            note,
            tx,
          })
      const manaAward = existingManaAward
        ? null
        : await applyMana({
            userId: existingRecord.userId,
            amount: ACHIEVEMENT_MANA_REWARD,
            reason: 'ACHIEVEMENT_CONFIRMED',
            refId,
            note,
            tx,
          })

      return {
        data,
        reward: {
          granted: Boolean(karmaAward || manaAward),
          karma: karmaAward ? existingRecord.Achievement.karma : 0,
          mana: manaAward ? ACHIEVEMENT_MANA_REWARD : 0,
          karmaBalance: karmaAward?.balance ?? null,
          manaBalance: manaAward?.balance ?? null,
        },
      }
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: result.reward.granted
        ? 'Achievement confirmed and rewards granted.'
        : 'Achievement record updated successfully.',
      data: result.data,
      reward: result.reward,
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
