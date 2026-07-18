// /server/api/achievements/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { requireAdminApiUser } from '../../utils/authGuard'
import {
  buildAchievementCreateInput,
  findAchievementByTriggerCode,
  prismaErrorCode,
} from './definition'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const body = await readBody<unknown>(event)

    if (Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message:
          'Achievement POST creates one definition. Use /api/achievements/batch for arrays.',
      })
    }

    const input = await buildAchievementCreateInput(body)
    const existing = await findAchievementByTriggerCode(input.triggerCode)

    if (existing) {
      throw createError({
        statusCode: 409,
        message: `Achievement triggerCode already exists: ${input.triggerCode}.`,
      })
    }

    const data = await prisma.achievement.create({ data: input })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Achievement created successfully.',
      data,
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = prismaErrorCode(error) === 'P2002'
      ? 409
      : handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message:
        statusCode === 409
          ? 'An Achievement with that triggerCode already exists.'
          : handled.message || 'Failed to create Achievement.',
      data: null,
      statusCode,
    }
  }
})
