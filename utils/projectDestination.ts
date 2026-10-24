/** Project destinations are Kind Robots presentation data, not inferred Conductor routes. */
export function projectDestination(url: string | null | undefined): string | null {
  const value = url?.trim()
  if (!value || value.startsWith('//') || value.includes('\\')) return null
  if (/^\/(?!\/)/.test(value)) {
    if (/^\/(?:conductor|plan\/projects|projects\/sheet)(?:[\/?#]|$)/i.test(value)) return null
    return value
  }
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' ? parsed.href : null
  } catch {
    return null
  }
}

export function projectSheetPath(slug: string): string {
  return `/projects/sheet/${encodeURIComponent(slug)}`
}
