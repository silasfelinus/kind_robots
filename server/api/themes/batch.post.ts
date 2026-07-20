// /server/api/themes/batch.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { validateApiKey } from '~/server/utils/validateKey'
import {
  fallbackThemeName,
  isThemeDuplicateError,
  normalizeThemeInput,
  parseTheme,
  type ParsedTheme,
  type ThemeBatchFailure,
  type ThemeBatchSkip,
  type ThemeCreateInput,
} from './index'
import {
  assertThemeMutationInput,
  themeBatchCreateFields,
  THEME_BATCH_LIMIT,
} from './mutation'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<ThemeCreateInput[]>(event)

    if (!Array.isArray(body) || !body.length) {
      throw createError({
        statusCode: 400,
        message: 'Theme batch body must be a non-empty array.',
      })
    }

    if (body.length > THEME_BATCH_LIMIT) {
      throw createError({
        statusCode: 400,
        message: `Theme batch may contain at most ${THEME_BATCH_LIMIT} entries.`,
      })
    }

    const created: ParsedTheme[] = []
    const skipped: ThemeBatchSkip[] = []
    const failed: ThemeBatchFailure[] = []

    for (const entry of body) {
      const fallbackName = fallbackThemeName(entry)

      try {
        assertThemeMutationInput(entry, {
          allowedFields: themeBatchCreateFields,
          context: 'Theme batch item',
        })

        const createInput = normalizeThemeInput(entry, user.id)

        try {
          const theme = await prisma.theme.create({ data: createInput })
          created.push(parseTheme(theme))
        } catch (error) {
          if (isThemeDuplicateError(error)) {
            skipped.push({
              name: createInput.name,
              reason: 'Theme with this name already exists.',
            })
            continue
          }

          throw error
        }
      } catch (error) {
        const handled = errorHandler(error)

        if (Number(handled.statusCode) >= 500) throw error

        failed.push({
          name: fallbackName,
          message: handled.message || 'Invalid Theme payload.',
        })
      }
    }

    if (!created.length && !skipped.length && failed.length) {
      event.node.res.statusCode = 400

      return {
        success: false,
        message: `No themes were created. ${failed.length} failed.`,
        data: { created, skipped, failed },
        statusCode: 400,
      }
    }

    const statusCode = failed.length ? 207 : created.length ? 201 : 200
    event.node.res.statusCode = statusCode

    return {
      success: failed.length === 0,
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
      message: handled.message || 'Failed to batch-create themes.',
      data: null,
      statusCode,
    }
  }
})
