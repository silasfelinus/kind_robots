// /server/api/themes/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import type { Theme } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { validateApiKey } from '~/server/utils/validateKey'

type ThemeColorScheme = 'light' | 'dark'

type ThemeCreateInput = {
  name?: unknown
  values?: unknown
  isPublic?: unknown
  tagline?: unknown
  room?: unknown
  prefersDark?: unknown
  colorScheme?: unknown
  artPrompt?: unknown
}

type ParsedTheme = Omit<Theme, 'values'> & {
  values: Record<string, unknown>
}

function stringifyThemeValues(values: unknown): string {
  if (!values) {
    return ''
  }

  if (typeof values === 'string') {
    try {
      const parsed = JSON.parse(values)

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return ''
      }

      return JSON.stringify(parsed)
    } catch {
      return ''
    }
  }

  if (typeof values !== 'object' || Array.isArray(values)) {
    return ''
  }

  try {
    return JSON.stringify(values)
  } catch {
    return ''
  }
}

function parseTheme(theme: Theme): ParsedTheme {
  let values: Record<string, unknown> = {}

  try {
    const parsed = JSON.parse(theme.values)

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      values = parsed
    }
  } catch {
    values = {}
  }

  return {
    ...theme,
    values,
  }
}

function normalizeThemeInput(entry: ThemeCreateInput, userId: number) {
  const {
    name,
    values,
    isPublic = false,
    tagline = null,
    room = null,
    prefersDark = false,
    colorScheme = 'light',
    artPrompt = null,
  } = entry || {}

  if (!name || typeof name !== 'string') {
    throw createError({
      statusCode: 400,
      message: '"name" is required.',
    })
  }

  if (
    typeof colorScheme !== 'string' ||
    !['light', 'dark'].includes(colorScheme)
  ) {
    throw createError({
      statusCode: 400,
      message: '"colorScheme" must be either "light" or "dark".',
    })
  }

  const valuesString = stringifyThemeValues(values)

  if (!valuesString) {
    throw createError({
      statusCode: 400,
      message: '"values" must be a valid object or JSON string.',
    })
  }

  return {
    name,
    values: valuesString,
    isPublic: Boolean(isPublic),
    tagline: typeof tagline === 'string' ? tagline : null,
    room: typeof room === 'string' ? room : null,
    prefersDark: Boolean(prefersDark),
    colorScheme: colorScheme as ThemeColorScheme,
    artPrompt: typeof artPrompt === 'string' ? artPrompt : null,
    userId,
  }
}

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
      if (!body.length) {
        throw createError({
          statusCode: 400,
          message: 'Theme array cannot be empty.',
        })
      }

      const themes: ParsedTheme[] = []
      const skipped: string[] = []

      for (const entry of body) {
        const data = normalizeThemeInput(entry, user.id)

        try {
          const theme = await prisma.theme.create({ data })
          themes.push(parseTheme(theme))
        } catch (error: any) {
          if (error?.code === 'P2002') {
            skipped.push(data.name)
            continue
          }

          throw error
        }
      }

      event.node.res.statusCode = 201

      return {
        success: true,
        message: `${themes.length} theme(s) created, ${skipped.length} duplicate(s) skipped.`,
        data: themes,
        themes,
        skipped,
        count: themes.length,
      }
    }

    const data = normalizeThemeInput(body, user.id)
    const theme = await prisma.theme.create({ data })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Theme created successfully.',
      data: parseTheme(theme),
      theme: parseTheme(theme),
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to create theme.',
    }
  }
})
