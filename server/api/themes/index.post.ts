import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'
import { validateApiKey } from '@/server/api/utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    const userId = isValid && user?.id ? user.id : 10

    const body = await readBody(event)

    const normalizeThemeInput = (entry: any) => {
      const {
        name,
        values,
        isPublic = false,
        tagline,
        room,
        prefersDark = false,
        colorScheme = 'light',
      } = entry

      if (!name || typeof name !== 'string') {
        throw createError({ statusCode: 400, message: '"name" is required.' })
      }

      if (!values || typeof values !== 'object' || Array.isArray(values)) {
        throw createError({
          statusCode: 400,
          message: '"values" must be a valid object.',
        })
      }

      if (colorScheme !== 'light' && colorScheme !== 'dark') {
        throw createError({
          statusCode: 400,
          message: '"colorScheme" must be either "light" or "dark".',
        })
      }

      return {
        name,
        values,
        isPublic,
        tagline: tagline || null,
        room: room || null,
        prefersDark,
        colorScheme,
        userId,
      }
    }

    if (Array.isArray(body)) {
      if (body.length === 0) {
        throw createError({
          statusCode: 400,
          message: 'Theme array cannot be empty.',
        })
      }

      const createdThemes = []
      const skipped: string[] = []

      for (const entry of body) {
        const themeData = normalizeThemeInput(entry)

        try {
          const created = await prisma.theme.create({ data: themeData })
          createdThemes.push(created)
        } catch (err: any) {
          if (err.code === 'P2002') {
            skipped.push(themeData.name)
          } else {
            throw err
          }
        }
      }

      event.node.res.statusCode = 201
      return {
        success: true,
        message: `${createdThemes.length} theme(s) created, ${skipped.length} duplicates skipped.`,
        themes: createdThemes,
        skipped,
        count: createdThemes.length,
      }
    }

    const themeInput = normalizeThemeInput(body)
    const theme = await prisma.theme.create({ data: themeInput })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'Theme created successfully.',
      theme,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to create theme(s).',
    }
  }
})
