// /server/api/themes/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'
import { validateApiKey } from '@/server/api/utils/validateKey'
import { stringifyValues, parseTheme } from '@/server/api/themes/index'
import type { Prisma } from '~/server/generated/prisma'

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
    if (!existing)
      throw createError({ statusCode: 404, message: 'Theme not found.' })
    if (
      existing.userId != null &&
      existing.userId !== user.id &&
      user.Role !== 'ADMIN'
    ) {
      throw createError({ statusCode: 403, message: 'Unauthorized.' })
    }

    const raw = await readBody<any>(event)
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
      if (key in raw) {
        if (key === 'values') {
          const s = stringifyValues(raw.values)
          if (!s)
            throw createError({
              statusCode: 400,
              message: '"values" must be a valid object or JSON string.',
            })
          ;(data as any).values = s // DB string
        } else if (key === 'colorScheme') {
          if (!['light', 'dark'].includes(raw.colorScheme)) {
            throw createError({
              statusCode: 400,
              message: '"colorScheme" must be either "light" or "dark".',
            })
          }
          ;(data as any).colorScheme = raw.colorScheme
        } else if (key === 'prefersDark' || key === 'isPublic') {
          ;(data as any)[key] = !!raw[key]
        } else {
          ;(data as any)[key] = raw[key] ?? null
        }
      }
    }

    const updated = await prisma.theme.update({ where: { id }, data })
    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Theme updated successfully.',
      theme: parseTheme(updated),
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || `Failed to update theme with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})
