// /utils/comicStudioImport.ts
//
// Import contract for seeding the Comic Studio from Conductor ledgers
// (comic-creator/t-013). The payload is posted once by utils/scripts/importComicLedger.ts;
// after that the database is the source of truth and nothing writes back to Conductor.
//
// Pure: no Prisma, no h3, no app aliases.
import { COMIC_ASPECTS, type ComicLane } from './comicLanes.js'
import {
  COMIC_ENTITY_KINDS,
  COMIC_SLOT_KINDS,
  COMIC_VERDICTS,
  oneOf,
} from './comicStudio.js'

export type ComicImportEntity = {
  key: string
  kind: string
  name: string
  notes?: string | null
  secretUntil?: string | null
  sortOrder?: number
}
export type ComicImportSlot = {
  key: string
  entityKey?: string | null
  kind?: string
  title: string
  notes?: string | null
  aspect?: string
  promptProse?: string | null
  promptTags?: string | null
  negativePrompt?: string | null
  useSeriesStyle?: boolean
  sortOrder?: number
}
export type ComicImportAttempt = {
  slotKey: string
  laneKey?: string | null
  artJobId: number
  verdict?: string
  expectRequestId?: string | null
}
export type ComicImportPayload = {
  series: {
    slug: string
    title?: string
    notes?: string | null
    styleProse?: string | null
    styleTags?: string | null
    negativeTags?: string | null
    lanes?: unknown
  }
  entities: ComicImportEntity[]
  slots: ComicImportSlot[]
  attempts: ComicImportAttempt[]
  issueNotes: string | null
}

const KEY_PATTERN = /^[a-z0-9][a-z0-9_-]*$/

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

export function normalizeComicImport(raw: unknown): {
  payload: ComicImportPayload | null
  errors: string[]
} {
  const errors: string[] = []
  const source =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const seriesRaw = (source.series ?? {}) as Record<string, unknown>
  const slug = text(seriesRaw.slug, 120)?.toLowerCase() ?? ''
  if (!KEY_PATTERN.test(slug))
    errors.push('series.slug must be a lowercase slug.')

  const entities: ComicImportEntity[] = []
  const entityKeys = new Set<string>()
  for (const item of Array.isArray(source.entities) ? source.entities : []) {
    const record = (item ?? {}) as Record<string, unknown>
    const key = text(record.key, 120)?.toLowerCase() ?? ''
    const name = text(record.name, 255)
    if (!KEY_PATTERN.test(key) || !name || entityKeys.has(key)) {
      errors.push(`Entity "${key || '?'}" needs a unique slug key and a name.`)
      continue
    }
    entityKeys.add(key)
    entities.push({
      key,
      kind: oneOf(COMIC_ENTITY_KINDS, record.kind, 'other'),
      name,
      notes: text(record.notes, 200_000),
      secretUntil: text(record.secretUntil, 255),
      sortOrder: Number.isInteger(record.sortOrder)
        ? Number(record.sortOrder)
        : entities.length,
    })
  }

  const slots: ComicImportSlot[] = []
  const slotKeys = new Set<string>()
  for (const item of Array.isArray(source.slots) ? source.slots : []) {
    const record = (item ?? {}) as Record<string, unknown>
    const key = text(record.key, 160)?.toLowerCase() ?? ''
    const title = text(record.title, 255)
    if (!KEY_PATTERN.test(key) || !title || slotKeys.has(key)) {
      errors.push(`Slot "${key || '?'}" needs a unique slug key and a title.`)
      continue
    }
    const entityKey = text(record.entityKey, 120)?.toLowerCase() ?? null
    if (entityKey && !entityKeys.has(entityKey)) {
      errors.push(`Slot "${key}" points at unknown entity "${entityKey}".`)
      continue
    }
    slotKeys.add(key)
    slots.push({
      key,
      entityKey,
      kind: oneOf(COMIC_SLOT_KINDS, record.kind, 'subject'),
      title,
      notes: text(record.notes, 8000),
      aspect: COMIC_ASPECTS.includes(String(record.aspect))
        ? String(record.aspect)
        : '1:1',
      promptProse: text(record.promptProse, 8000),
      promptTags: text(record.promptTags, 8000),
      negativePrompt: text(record.negativePrompt, 4000),
      useSeriesStyle: record.useSeriesStyle !== false,
      sortOrder: Number.isInteger(record.sortOrder)
        ? Number(record.sortOrder)
        : slots.length,
    })
  }

  const attempts: ComicImportAttempt[] = []
  const jobIds = new Set<number>()
  for (const item of Array.isArray(source.attempts) ? source.attempts : []) {
    const record = (item ?? {}) as Record<string, unknown>
    const slotKey = text(record.slotKey, 160)?.toLowerCase() ?? ''
    const artJobId = Number(record.artJobId)
    if (
      !slotKeys.has(slotKey) ||
      !Number.isInteger(artJobId) ||
      artJobId <= 0
    ) {
      errors.push(
        `Attempt for "${slotKey || '?'}" needs a known slot and an ArtJob id.`,
      )
      continue
    }
    if (jobIds.has(artJobId)) {
      errors.push(`ArtJob ${artJobId} is listed twice.`)
      continue
    }
    jobIds.add(artJobId)
    attempts.push({
      slotKey,
      laneKey: text(record.laneKey, 64),
      artJobId,
      verdict: oneOf(COMIC_VERDICTS, record.verdict, 'none'),
      expectRequestId: text(record.expectRequestId, 200),
    })
  }

  if (!KEY_PATTERN.test(slug)) return { payload: null, errors }
  return {
    payload: {
      series: {
        slug,
        title: text(seriesRaw.title, 255) ?? slug,
        notes: text(seriesRaw.notes, 200_000),
        styleProse: text(seriesRaw.styleProse, 4000),
        styleTags: text(seriesRaw.styleTags, 4000),
        negativeTags: text(seriesRaw.negativeTags, 4000),
        lanes: seriesRaw.lanes,
      },
      entities,
      slots,
      attempts,
      issueNotes: text(source.issueNotes, 200_000),
    },
    errors,
  }
}

type GraphNode = { class_type?: unknown; inputs?: Record<string, unknown> }

export function detectComicLaneForJob(
  lanes: ComicLane[],
  workflow: Record<string, unknown> | null | undefined,
): string | null {
  if (!workflow || typeof workflow !== 'object') return null
  for (const raw of Object.values(workflow)) {
    const node = (raw ?? {}) as GraphNode
    const inputs = node.inputs ?? {}
    const ckpt = typeof inputs.ckpt_name === 'string' ? inputs.ckpt_name : ''
    if (ckpt) {
      const match = lanes.find(
        (lane) =>
          lane.engine === 'comfy' &&
          lane.checkpoint &&
          ckpt.endsWith(lane.checkpoint.split('/').pop() ?? lane.checkpoint),
      )
      if (match) return match.key
    }
    const unet =
      typeof inputs.unet_name === 'string' ? inputs.unet_name.toLowerCase() : ''
    if (unet.includes('krea'))
      return lanes.find((lane) => lane.engine === 'krea2')?.key ?? null
    if (unet.includes('z_image'))
      return lanes.find((lane) => lane.engine === 'zimage')?.key ?? null
  }
  return null
}

export function comicJobRequestId(
  payload: Record<string, unknown> | null | undefined,
): string | null {
  if (!payload) return null
  const request = payload.conductorRequest as
    Record<string, unknown> | undefined
  const provenance = payload.provenance as Record<string, unknown> | undefined
  const candidates = [
    request?.id,
    payload.idempotencyKey,
    provenance?.idempotencyKey,
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim())
      return candidate.trim()
  }
  return null
}
