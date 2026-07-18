// /server/api/achievements/batch.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { requireAdminApiUser } from '../../utils/authGuard'
import {
  buildAchievementCreateInput,
  fallbackAchievementLabel,
  findAchievementByTriggerCode,
  isAchievementInfrastructureError,
  type AchievementBatchFailure,
  type AchievementBatchSkip,
} from './definition'
import type { Achievement } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const body = await readBody<unknown>(event)

    if (!Array.isArray(body) || !body.length) {
      throw createError({
        statusCode: 400,
        message: 'Achievement batch body must be a non-empty array.',
      })
    }

    const created: Achievement[] = []
    const skipped: AchievementBatchSkip[] = []
    const failed: AchievementBatchFailure[] = []

    for (const entry of body) {
      const fallbackLabel = fallbackAchievementLabel(entry)

      try {
        const input = await buildAchievementCreateInput(entry)
        const existing = await findAchievementByTriggerCode(input.triggerCode)

        if (existing) {
          skipped.push({
            label: input.label,
            triggerCode: input.triggerCode,
            existingId: existing.id,
            reason: 'Achievement triggerCode already exists.',
          })
          continue
        }

        const achievement = await prisma.achievement.create({ data: input })
        created.push(achievement)
      } catch (error) {
        if (isAchievementInfrastructureError(error)) throw error

        const handled = errorHandler(error)
        failed.push({
          label: fallbackLabel,
          message: handled.message || 'Invalid Achievement definition.',
        })
      }
    }

    if (!created.length && !skipped.length && failed.length) {
      event.node.res.statusCode = 400

      return {
        success: false,
        message: `No Achievements were created. ${failed.length} failed.`,
        data: { created, skipped, failed },
        statusCode: 400,
      }
    }

    const statusCode = failed.length ? 207 : created.length ? 201 : 200
    event.node.res.statusCode = statusCode

    return {
      success: created.length > 0 || failed.length === 0,
      message: `${created.length} created, ${skipped.length} skipped, ${failed.length} failed.`,
      data: { created, skipped, failed },
      statusCode,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to batch-create Achievements.',
      data: null,
      statusCode,
    }
  }
})
