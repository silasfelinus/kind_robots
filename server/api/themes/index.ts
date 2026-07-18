// /server/api/themes/index.ts
import { createError } from 'h3'
import type { Prisma, Theme } from '~/prisma/generated/prisma/client'

export type ParsedTheme = Omit<Theme, 'values'> & {
  values: Record<string, string>
}

export type ThemeCreateInput = {
  name?: unknown
  values?: unknown
  isPublic?: unknown
  tagline?: unknown
  room?: unknown
  prefersDark?: unknown
  colorScheme?: unknown
  artPrompt?: unknown
}

export type ThemeBatchSkip = {
  name: string
  reason: string
}

export type ThemeBatchFailure = {
  name: string
  message: string
}

export function stringifyValues(values: unknown): string | undefined {
  if (!values) {
    return undefined
  }

  if (typeof values === 'string') {
    try {
      const parsed = JSON.parse(values)

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return undefined
      }

      return JSON.stringify(parsed)
    } catch {
      return undefined
    }
  }

  if (typeof values === 'object' && !Array.isArray(values)) {
    try {
      return JSON.stringify(values)
    } catch {
      return undefined
    }
  }

  return undefined
}

export function parseTheme(theme: Theme): ParsedTheme {
  let parsed: Record<string, string> = {}

  try {
    const values =
      typeof theme.values === 'string' && theme.values.trim()
        ? JSON.parse(theme.values)
        : {}

    if (values && typeof values === 'object' && !Array.isArray(values)) {
      parsed = values as Record<string, string>
    }
  } catch {
    parsed = {}
  }

  return {
    ...theme,
    values: parsed,
  }
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

export function fallbackThemeName(input: ThemeCreateInput): string {
  return typeof input?.name === 'string' && input.name.trim()
    ? input.name.trim()
    : 'Untitled theme'
}

export function normalizeThemeInput(
  input: ThemeCreateInput,
  userId: number,
): Prisma.ThemeUncheckedCreateInput {
  const name = fallbackThemeName(input)

  if (name === 'Untitled theme') {
    throw createError({
      statusCode: 400,
      message: '"name" is required.',
    })
  }

  if (name.length > 191) {
    throw createError({
      statusCode: 400,
      message: '"name" must be 191 characters or fewer.',
    })
  }

  const values = stringifyValues(input.values)

  if (!values) {
    throw createError({
      statusCode: 400,
      message: '"values" must be a valid object or JSON string.',
    })
  }

  const colorScheme = input.colorScheme ?? 'light'

  if (colorScheme !== 'light' && colorScheme !== 'dark') {
    throw createError({
      statusCode: 400,
      message: '"colorScheme" must be either "light" or "dark".',
    })
  }

  return {
    name,
    values,
    isPublic: booleanValue(input.isPublic, false),
    tagline: optionalText(input.tagline),
    room: optionalText(input.room),
    prefersDark: booleanValue(input.prefersDark, false),
    colorScheme,
    artPrompt: optionalText(input.artPrompt),
    userId,
  }
}

export function isThemeDuplicateError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002',
  )
}
