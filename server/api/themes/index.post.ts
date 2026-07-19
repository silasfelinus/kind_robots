// /server/api/themes/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { validateApiKey } from '~/server/utils/validateKey'
import {
  isThemeDuplicateError,
  normalizeThemeInput,
  parseTheme,
  type ThemeCreateInput,
} from './index'
import { assertThemeMutationInput, themeCreateFields } from './mutation'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<ThemeCreateInput | ThemeCreateInput[]>(event)

    if (Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message:
          'POST /api/themes creates one Theme. Use /api/themes/batch for arrays.',
      })
    }

    if (!body || typeof body !== 'object') {
      throw createError({
        statusCode: 400,
        message: 'Request body is required.',
      })
    }

    assertThemeMutationInput(body, {
      allowedFields: themeCreateFields,
      context: 'Theme create payload',
      authenticatedUserId: user.id,
    })

    const createInput = normalizeThemeInput(body, user.id)

    try {
      const theme = await prisma.theme.create({ data: createInput })

      event.node.res.statusCode = 201

      return {
        success: true,
        message: 'Theme created successfully.',
        data: parseTheme(theme),
        statusCode: 201,
      }
    } catch (error) {
      if (isThemeDuplicateError(error)) {
        throw createError({
          statusCode: 409,
          message: `Theme "${createInput.name}" already exists.`,
        })
      }

      throw error
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to create theme.',
      data: null,
      statusCode,
    }
  }
})
