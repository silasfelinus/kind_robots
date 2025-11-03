// /server/api/themes/index.ts
import type { Theme } from '@prisma/client'

export function stringifyValues(values: unknown): string | undefined {
  if (!values) return undefined
  if (typeof values === 'string') return values
  if (typeof values === 'object' && !Array.isArray(values)) {
    return JSON.stringify(values)
  }
  return undefined
}

export function parseTheme(theme: Theme) {
  let parsed: Record<string, string> = {}
  try {
    parsed =
      typeof theme.values === 'string' && theme.values.trim()
        ? (JSON.parse(theme.values) as Record<string, string>)
        : {}
  } catch {
    parsed = {}
  }
  return { ...theme, values: parsed }
}
