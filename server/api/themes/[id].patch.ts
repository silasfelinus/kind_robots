// /server/api/themes/[id].patch.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { validateApiKey } from '~/server/utils/validateKey'
import { stringifyValues, parseTheme } from '@/server/api/themes/index'
import type { Prisma } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  let id: number | undefined

  try {
    id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid theme ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existing = await prisma.theme.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existing) {
      throw createError({ statusCode: 404, message: 'Theme not found.' })
    }

    if (
      existing.userId != null &&
      existing.userId !== user.id &&
      user.Role !== 'ADMIN'
    ) {
      throw createError({ statusCode: 403, message: 'Unauthorized.' })
    }

    const raw = await readBody<Record<string, unknown>>(event)

    if (!raw || Object.keys(raw).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const allowed = [
      'name',
      'values',
      'tagline',
      'room',
      'prefersDark',
      'colorScheme',
      'isPublic',
    ] as const
    const data: Prisma.ThemeUpdateInput = {}

    for (const key of allowed) {
      if (!(key in raw)) continue

      if (key === 'values') {
        const values = stringifyValues(raw.values)

        if (!values) {
          throw createError({
            statusCode: 400,
            message: '"values" must be a valid object or JSON string.',
          })
        }

        data.values = values
        continue
      }

      if (key === 'colorScheme') {
        if (raw.colorScheme !== 'light' && raw.colorScheme !== 'dark') {
          throw createError({
            statusCode: 400,
            message: '"colorScheme" must be either "light" or "dark".',
          })
        }

        data.colorScheme = raw.colorScheme
        continue
      }

      if (key === 'prefersDark' || key === 'isPublic') {
        if (typeof raw[key] !== 'boolean') {
          throw createError({
            statusCode: 400,
            message: `"${key}" must be a boolean.`,
          })
        }

        data[key] = raw[key]
        continue
      }

      if (key === 'name') {
        if (typeof raw.name !== 'string' || !raw.name.trim()) {
          throw createError({
            statusCode: 400,
            message: '"name" must be a non-empty string.',
          })
        }

        data.name = raw.name.trim()
        continue
      }

      const value = raw[key]
      const normalized =
        typeof value === 'string' && value.trim() ? value.trim() : null

      if (key === 'tagline') data.tagline = normalized
      if (key === 'room') data.room = normalized
    }

    const updated = await prisma.theme.update({ where: { id }, data })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Theme updated successfully.',
      data: parseTheme(updated),
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || `Failed to update theme with ID ${id}.`,
      data: null,
      statusCode,
    }
  }
})
