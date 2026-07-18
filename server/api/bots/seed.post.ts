// /server/api/bots/seed.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { botData } from '../../../stores/seeds/seedBots'
import { updateBots } from '.'
import { errorHandler } from '../../utils/error'
import { requireAdminApiUser } from '../../utils/authGuard'

function parseSeedOptions(body: unknown): { dryRun: boolean } {
  if (body === undefined || body === null || body === '') {
    return { dryRun: false }
  }

  if (typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: 'Bot seed payload must be an object.',
    })
  }

  const record = body as Record<string, unknown>
  const unsupportedFields = Object.keys(record).filter(
    (field) => field !== 'dryRun',
  )

  if (unsupportedFields.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported bot seed fields: ${unsupportedFields.join(', ')}.`,
    })
  }

  if (record.dryRun !== undefined && typeof record.dryRun !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: '"dryRun" must be a boolean.',
    })
  }

  return { dryRun: record.dryRun === true }
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const { dryRun } = parseSeedOptions(await readBody<unknown>(event))

    if (dryRun) {
      event.node.res.statusCode = 200

      return {
        success: true,
        message: 'Bot seed dry run completed. No bots were changed.',
        data: {
          dryRun: true,
          seedCount: botData.length,
        },
        statusCode: 200,
      }
    }

    const result = await updateBots(botData)

    event.node.res.statusCode = 200

    return {
      success: result.success,
      message: result.errors.length
        ? `Bot seed completed with ${result.errors.length} errors.`
        : 'Bot seed completed successfully.',
      data: result.data,
      errors: result.errors,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to seed bots.',
      data: null,
      statusCode,
    }
  }
})
