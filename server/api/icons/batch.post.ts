// /server/api/icons/batch.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import {
  buildSmartIconCreateInput,
  fallbackSmartIconTitle,
  findExistingSmartIcon,
  type SmartIconBatchFailure,
  type SmartIconBatchSkip,
  type SmartIconCreateBody,
} from './create'
import type { SmartIcon } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<SmartIconCreateBody[]>(event)

    if (!Array.isArray(body) || !body.length) {
      throw createError({
        statusCode: 400,
        message: 'SmartIcon batch body must be a non-empty array.',
      })
    }

    const created: SmartIcon[] = []
    const skipped: SmartIconBatchSkip[] = []
    const failed: SmartIconBatchFailure[] = []

    for (const entry of body) {
      const fallbackTitle = fallbackSmartIconTitle(entry)

      try {
        const data = buildSmartIconCreateInput(entry, user.id)
        const existing = await findExistingSmartIcon({
          title: data.title,
          type: data.type,
          userId: user.id,
        })

        if (existing) {
          skipped.push({
            title: data.title,
            type: data.type,
            existingId: existing.id,
            reason: 'SmartIcon with this title and type already exists.',
          })
          continue
        }

        created.push(await prisma.smartIcon.create({ data }))
      } catch (error) {
        const handled = errorHandler(error)

        if (Number(handled.statusCode) >= 500) throw error

        failed.push({
          title: fallbackTitle,
          message: handled.message || 'Invalid SmartIcon payload.',
        })
      }
    }

    if (!created.length && !skipped.length && failed.length) {
      event.node.res.statusCode = 400

      return {
        success: false,
        message: `No SmartIcons were created. ${failed.length} failed.`,
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
      message: handled.message || 'Failed to batch-create SmartIcons.',
      data: null,
      statusCode,
    }
  }
})
