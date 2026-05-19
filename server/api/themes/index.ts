// /server/api/themes/index.ts
import type { Theme } from '~/prisma/generated/prisma/client'

export type ParsedTheme = Omit<Theme, 'values'> & {
  values: Record<string, string>
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
