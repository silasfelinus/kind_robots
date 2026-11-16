import { createHash } from 'node:crypto'
import { createError } from 'h3'

export const TUTORIAL_NOTE_LIMIT = 5000

export type TutorialCopy = {
  path: string
  draftText: string
  publishedText: string | null
  publishedAt: string | null
}

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

export function tutorialPageKey(path: string): string {
  const slug = (path === '/' ? 'home' : path.slice(1).replaceAll('/', '-'))
    .slice(0, 60)
  const hash = createHash('sha256').update(path).digest('hex').slice(0, 16)
  return 'tutorial-' + slug + '-' + hash
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

export function parseTutorialCopy(
  serialized: string | null | undefined,
  path: string,
): TutorialCopy | null {
  if (!serialized) return null
  const payload: unknown = JSON.parse(serialized)
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    (payload as Record<string, unknown>).path !== path
  ) {
    throw createError({ statusCode: 500, message: 'Invalid saved tutorial note.' })
  }
  const data = payload as Record<string, unknown>
  return {
    path,
    draftText: typeof data.draftText === 'string' ? data.draftText : '',
    publishedText:
      typeof data.publishedText === 'string' ? data.publishedText : null,
    publishedAt:
      typeof data.publishedAt === 'string' ? data.publishedAt : null,
  }
}

export function publicTutorialText(
  path: string,
  publishedText: string | null | undefined,
): string {
  return path.startsWith('/admin/') ? '' : (publishedText ?? '')
}
