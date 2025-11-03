// /server/api/themes/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'
import { validateApiKey } from '@/server/api/utils/validateKey'
import { stringifyValues, parseTheme } from '@/server/api/themes/index'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }
    const userId = user.id

    const body = await readBody<any>(event)

    const normalize = (entry: any) => {
      const {
        name,
        values,
        isPublic = false,
        tagline = null,
        room = null,
        prefersDark = false,
        colorScheme = 'light',
      } = entry || {}

      if (!name || typeof name !== 'string') {
        throw createError({ statusCode: 400, message: '"name" is required.' })
      }
      if (!['light', 'dark'].includes(colorScheme)) {
        throw createError({
          statusCode: 400,
          message: '"colorScheme" must be either "light" or "dark".',
        })
      }

      const valuesStr = stringifyValues(values)
      if (!valuesStr) {
        throw createError({
          statusCode: 400,
          message: '"values" must be a valid object or JSON string.',
        })
      }

      return {
        name,
        values: valuesStr, // <-- DB expects string
        isPublic: !!isPublic,
        tagline,
        room,
        prefersDark: !!prefersDark,
        colorScheme,
        userId,
      }
    }

    // Bulk create (array) or single
    if (Array.isArray(body)) {
      if (body.length === 0) {
        throw createError({
          statusCode: 400,
          message: 'Theme array cannot be empty.',
        })
      }
      const created: any[] = []
      const skipped: string[] = []

      for (const entry of body) {
        const data = normalize(entry)
        try {
          const row = await prisma.theme.create({ data })
          created.push(parseTheme(row)) // return parsed values
        } catch (err: any) {
          if (err?.code === 'P2002') skipped.push(data.name)
          else throw err
        }
      }

      event.node.res.statusCode = 201
      return {
        success: true,
        message: `${created.length} theme(s) created, ${skipped.length} duplicates skipped.`,
        themes: created,
        skipped,
        count: created.length,
      }
    }

    const data = normalize(body)
    const theme = await prisma.theme.create({ data })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'Theme created successfully.',
      theme: parseTheme(theme),
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, message: message || 'Failed to create theme(s).' }
  }
})
