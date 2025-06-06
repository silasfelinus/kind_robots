// /server/api/themes/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'
import { validateApiKey } from '@/server/api/utils/validateKey'
import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let id
  let response

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
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

    const userId = user.id
    const existingTheme = await prisma.theme.findUnique({ where: { id } })
    if (!existingTheme) {
      throw createError({ statusCode: 404, message: 'Theme not found.' })
    }

    if (existingTheme.userId !== userId && user.Role !== 'ADMIN') {
      throw createError({ statusCode: 403, message: 'Unauthorized.' })
    }

    const rawUpdate = await readBody(event)
    if (!rawUpdate || Object.keys(rawUpdate).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const allowedKeys = [
      'name',
      'values',
      'tagline',
      'room',
      'prefersDark',
      'colorScheme',
      'isPublic',
    ]

    const data: Prisma.ThemeUpdateInput = {}
    for (const key of allowedKeys) {
      if (key in rawUpdate) {
        ;(data as any)[key] = rawUpdate[key]
      }
    }

    if (
      'colorScheme' in data &&
      !['light', 'dark'].includes(data.colorScheme as string)
    ) {
      throw createError({
        statusCode: 400,
        message: '"colorScheme" must be either "light" or "dark".',
      })
    }

    if (
      'values' in data &&
      (typeof data.values !== 'object' || Array.isArray(data.values))
    ) {
      throw createError({
        statusCode: 400,
        message: '"values" must be a valid object.',
      })
    }

    const updated = await prisma.theme.update({
      where: { id },
      data,
    })

    event.node.res.statusCode = 200
    response = {
      success: true,
      message: 'Theme updated successfully.',
      theme: updated,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to update theme with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
