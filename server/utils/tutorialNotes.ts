import { createError } from 'h3'

export const TUTORIAL_NOTE_LIMIT = 5000

export function normalizeTutorialPath(raw: unknown): string {
  const path = typeof raw === 'string' ? raw.trim() : ''
  if (
    path.length > 180 ||
    !/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(path)
  ) {
    throw createError({ statusCode: 400, message: 'Invalid tutorial route.' })
  }
  return path
}

export function normalizeTutorialText(raw: unknown): string {
  if (typeof raw !== 'string' || raw.length > TUTORIAL_NOTE_LIMIT) {
    throw createError({
      statusCode: 400,
      message: 'Developer note must be text of at most 5000 characters.',
    })
  }
  return raw.trim()
}

export function publicTutorialText(
  path: string,
  publishedText: string | null | undefined,
): string {
  return path.startsWith('/admin/') ? '' : publishedText ?? ''
}
