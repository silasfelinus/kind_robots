// /utils/comicStudio.ts
//
// Comic Studio vocabulary and pure rules (comic-creator/t-013). The database stores
// kinds, statuses and verdicts as short text so a new value needs no migration; this
// file is where they are validated.
//
// Pure: no Prisma, no h3, no app aliases.

export const COMIC_ENTITY_KINDS = [
  'character',
  'faction',
  'creature',
  'place',
  'cover',
  'twist',
  'plot',
  'prop',
  'other',
] as const
export type ComicEntityKind = (typeof COMIC_ENTITY_KINDS)[number]

export const COMIC_SLOT_KINDS = ['subject', 'cover', 'panel'] as const
export type ComicSlotKind = (typeof COMIC_SLOT_KINDS)[number]

export const COMIC_SLOT_STATUSES = [
  'open',
  'accepted',
  'final',
  'rejected',
] as const
export type ComicSlotStatus = (typeof COMIC_SLOT_STATUSES)[number]

export const COMIC_ATTEMPT_STATUSES = [
  'QUEUING',
  'PENDING',
  'RUNNING',
  'DONE',
  'FAILED',
  'CANCELLED',
] as const
export type ComicAttemptStatus = (typeof COMIC_ATTEMPT_STATUSES)[number]

export const COMIC_VERDICTS = ['none', 'liked', 'rejected', 'selected'] as const
export type ComicVerdict = (typeof COMIC_VERDICTS)[number]

export const COMIC_QUEUING_TIMEOUT_MS = 120_000

export type ComicAttemptLike = {
  id: number
  slotId: number
  laneKey: string
  status: string
  verdict: string
  artImageId?: number | null
  createdAt: string | Date
}

export function isComicActiveStatus(status: string): boolean {
  return status === 'QUEUING' || status === 'PENDING' || status === 'RUNNING'
}

export function oneOf<T extends string>(
  list: readonly T[],
  value: unknown,
  fallback: T,
): T {
  return list.includes(value as T) ? (value as T) : fallback
}

export function applyComicVerdict<T extends ComicAttemptLike>(
  attempts: T[],
  attemptId: number,
  requested: ComicVerdict,
): T[] {
  const target = attempts.find((attempt) => attempt.id === attemptId)
  if (!target) return attempts
  const next: ComicVerdict = target.verdict === requested ? 'none' : requested
  return attempts.map((attempt) => {
    if (attempt.id === attemptId) return { ...attempt, verdict: next }
    if (
      next === 'selected' &&
      attempt.slotId === target.slotId &&
      attempt.verdict === 'selected'
    ) {
      return { ...attempt, verdict: 'liked' }
    }
    return attempt
  })
}

export type ComicJobSnapshot = {
  status: string
  artImageId?: number | null
  error?: string | null
} | null

export function reconcileComicAttemptStatus(
  attempt: {
    status: string
    artJobId?: number | null
    artImageId?: number | null
    createdAt: string | Date
  },
  job: ComicJobSnapshot,
  now: number = Date.now(),
): {
  status: ComicAttemptStatus
  artImageId: number | null
  error: string | null
} | null {
  const current = {
    status: oneOf(COMIC_ATTEMPT_STATUSES, attempt.status, 'FAILED'),
    artImageId: attempt.artImageId ?? null,
  }
  if (!attempt.artJobId) {
    if (current.status !== 'QUEUING') return null
    const age = now - new Date(attempt.createdAt).getTime()
    return age > COMIC_QUEUING_TIMEOUT_MS
      ? {
          status: 'FAILED',
          artImageId: null,
          error: 'The enqueue request never completed.',
        }
      : null
  }
  if (!job) {
    return current.status === 'FAILED'
      ? null
      : {
          status: 'FAILED',
          artImageId: current.artImageId,
          error: `ArtJob ${attempt.artJobId} no longer exists.`,
        }
  }
  const status = oneOf(COMIC_ATTEMPT_STATUSES, job.status, 'PENDING')
  const artImageId = job.artImageId ?? current.artImageId
  if (status === current.status && artImageId === current.artImageId)
    return null
  return {
    status,
    artImageId,
    error: status === 'FAILED' ? (job.error ?? 'Render failed.') : null,
  }
}

export type ComicDisplayStatus =
  'queued' | 'rendering' | 'ready' | 'undelivered' | 'failed'

export function comicDisplayStatus(attempt: {
  status: string
  artImageId?: number | null
}): ComicDisplayStatus {
  if (attempt.status === 'DONE')
    return attempt.artImageId ? 'ready' : 'undelivered'
  if (attempt.status === 'RUNNING') return 'rendering'
  if (attempt.status === 'FAILED' || attempt.status === 'CANCELLED')
    return 'failed'
  return 'queued'
}

function newestFirst<T extends ComicAttemptLike>(attempts: T[]): T[] {
  return [...attempts].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
      b.id - a.id,
  )
}

export function comicLaneHero<T extends ComicAttemptLike>(
  attempts: T[],
  laneKey: string,
): T | null {
  const lane = newestFirst(
    attempts.filter((attempt) => attempt.laneKey === laneKey),
  )
  return (
    lane.find((attempt) => attempt.verdict === 'selected') ??
    lane.find((attempt) => attempt.verdict === 'liked' && attempt.artImageId) ??
    lane.find((attempt) => attempt.verdict !== 'rejected') ??
    lane[0] ??
    null
  )
}

export function comicSlotCover<T extends ComicAttemptLike>(
  attempts: T[],
): T | null {
  const sorted = newestFirst(attempts.filter((attempt) => attempt.artImageId))
  return (
    sorted.find((attempt) => attempt.verdict === 'selected') ??
    sorted.find((attempt) => attempt.verdict === 'liked') ??
    sorted.find((attempt) => attempt.verdict !== 'rejected') ??
    null
  )
}

export type ComicFieldSpec = {
  type: 'text' | 'longtext' | 'boolean' | 'int' | 'nullableInt' | 'enum'
  max?: number
  values?: readonly string[]
  nullable?: boolean
}

export function normalizeComicUpdate(
  body: unknown,
  spec: Record<string, ComicFieldSpec>,
): { data: Record<string, unknown>; errors: string[] } {
  const data: Record<string, unknown> = {}
  const errors: string[] = []
  const record =
    body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  for (const [key, value] of Object.entries(record)) {
    const field = spec[key]
    if (!field) {
      errors.push(`Field "${key}" cannot be changed here.`)
      continue
    }
    if (value === null && (field.nullable || field.type === 'nullableInt')) {
      data[key] = null
      continue
    }
    if (field.type === 'text' || field.type === 'longtext') {
      if (typeof value !== 'string') {
        errors.push(`Field "${key}" must be text.`)
        continue
      }
      const max = field.max ?? (field.type === 'longtext' ? 200_000 : 4000)
      if (value.length > max) {
        errors.push(`Field "${key}" is longer than ${max} characters.`)
        continue
      }
      data[key] = field.nullable && !value.trim() ? null : value
    } else if (field.type === 'boolean') {
      if (typeof value !== 'boolean')
        errors.push(`Field "${key}" must be true or false.`)
      else data[key] = value
    } else if (field.type === 'int' || field.type === 'nullableInt') {
      const number = Number(value)
      if (!Number.isInteger(number))
        errors.push(`Field "${key}" must be a whole number.`)
      else data[key] = number
    } else if (field.type === 'enum') {
      if (!field.values?.includes(String(value)))
        errors.push(`Field "${key}" has an unknown value.`)
      else data[key] = String(value)
    }
  }
  return { data, errors }
}

export const COMIC_SERIES_FIELDS: Record<string, ComicFieldSpec> = {
  title: { type: 'text', max: 255 },
  notes: { type: 'longtext', nullable: true },
  styleProse: { type: 'text', max: 4000, nullable: true },
  styleTags: { type: 'text', max: 4000, nullable: true },
  negativeTags: { type: 'text', max: 4000, nullable: true },
  isPublicArt: { type: 'boolean' },
  coverAttemptId: { type: 'nullableInt' },
  isArchived: { type: 'boolean' },
}

export const COMIC_ENTITY_FIELDS: Record<string, ComicFieldSpec> = {
  name: { type: 'text', max: 255 },
  kind: { type: 'enum', values: COMIC_ENTITY_KINDS },
  notes: { type: 'longtext', nullable: true },
  secretUntil: { type: 'text', max: 255, nullable: true },
  portraitAttemptId: { type: 'nullableInt' },
  isArchived: { type: 'boolean' },
}

export const COMIC_SLOT_FIELDS: Record<string, ComicFieldSpec> = {
  title: { type: 'text', max: 255 },
  notes: { type: 'text', max: 8000, nullable: true },
  aspect: { type: 'text', max: 16 },
  promptProse: { type: 'text', max: 8000, nullable: true },
  promptTags: { type: 'text', max: 8000, nullable: true },
  negativePrompt: { type: 'text', max: 4000, nullable: true },
  useSeriesStyle: { type: 'boolean' },
  status: { type: 'enum', values: COMIC_SLOT_STATUSES },
  entityId: { type: 'nullableInt' },
  isArchived: { type: 'boolean' },
}

export const COMIC_ISSUE_FIELDS: Record<string, ComicFieldSpec> = {
  title: { type: 'text', max: 255 },
  number: { type: 'int' },
  notes: { type: 'longtext', nullable: true },
  isArchived: { type: 'boolean' },
}

export function comicArrangementDiff(
  current: Array<{ id: number; sortOrder: number; entityId?: number | null }>,
  requested: Array<{ id: number; entityId?: number | null }>,
): Array<{ id: number; sortOrder: number; entityId?: number | null }> {
  const byId = new Map(current.map((row) => [row.id, row]))
  const changes: Array<{
    id: number
    sortOrder: number
    entityId?: number | null
  }> = []
  requested.forEach((row, index) => {
    const existing = byId.get(row.id)
    if (!existing) return
    const entityChanged =
      row.entityId !== undefined && row.entityId !== (existing.entityId ?? null)
    if (existing.sortOrder !== index || entityChanged) {
      changes.push({
        id: row.id,
        sortOrder: index,
        ...(row.entityId !== undefined ? { entityId: row.entityId } : {}),
      })
    }
  })
  return changes
}
