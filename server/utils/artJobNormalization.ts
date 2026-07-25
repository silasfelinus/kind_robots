import { createError } from 'h3'
import {
  parseArtJobPayload,
  type ArtJobPayloadRecord,
} from './artJobPayload'

export const KIND_ROBOTS_REPO = 'silasfelinus/kind_robots'

export const DEFAULT_ASSET_ART_DIRECTION =
  'detailed mature western animation with multidimensional worldbuilding, expressive anatomy and faces, confident ink-like linework, dimensional shapes, rich controlled color, cinematic lighting, tactile environments, and clear readable silhouettes; cast characters naturally across many species, ages, body sizes, body shapes, gender presentations, and levels of conventional attractiveness; include robots only when the subject or scene explicitly calls for them'

const VAGUE_ART_DIRECTION =
  /\b(?:(?:rich|cohesive|friendly)\s+)?Kind Robots\s+(?:visual\s+)?(?:style|language)\b/gi

function asRecord(value: unknown): ArtJobPayloadRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as ArtJobPayloadRecord
}

function cleanPath(value: unknown): string {
  let path = String(value || '').trim().replace(/\\/g, '/')
  if (!path) return ''

  try {
    const parsed = new URL(path, 'https://kindrobots.org')
    path = decodeURIComponent(parsed.pathname)
  } catch {
    path = path.split('?', 1)[0]!.split('#', 1)[0]!
  }

  while (path.startsWith('./')) path = path.slice(2)
  return path.replace(/^\/+/, '')
}

function assertSafePath(path: string): void {
  const parts = path.split('/')
  if (
    parts.length < 3 ||
    parts.some((part) => !part || part === '.' || part === '..')
  ) {
    throw createError({
      statusCode: 400,
      message: `Unsafe Kind Robots imagePath "${path}".`,
    })
  }
}

export function normalizeKindRobotsImagePath(value: unknown): string {
  const path = cleanPath(value)
  let normalized = ''

  if (path.startsWith('public/images/')) {
    normalized = path
  } else if (path.startsWith('images/')) {
    normalized = `public/${path}`
  } else if (path.startsWith('public/rewards/')) {
    normalized = `public/images/${path.slice('public/'.length)}`
  } else if (path.startsWith('rewards/')) {
    normalized = `public/images/${path}`
  }

  if (!normalized) {
    throw createError({
      statusCode: 400,
      message:
        'Kind Robots ArtJob imagePath must begin with public/images/.',
    })
  }

  assertSafePath(normalized)
  return normalized
}

export function replaceVagueArtDirection(value: string): string {
  return value
    .replace(VAGUE_ART_DIRECTION, DEFAULT_ASSET_ART_DIRECTION)
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeStringsDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeStringsDeep)

  if (!value || typeof value !== 'object') {
    return typeof value === 'string' ? replaceVagueArtDirection(value) : value
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, child]) => [
      key,
      normalizeStringsDeep(child),
    ]),
  )
}

export type ArtJobNormalizationResult = {
  payload: ArtJobPayloadRecord
  imagePathChanged: boolean
  promptChanged: boolean
}

export function normalizeQueuedArtJobPayload(
  rawPayload: unknown,
): ArtJobNormalizationResult {
  const original = structuredClone(parseArtJobPayload(rawPayload))
  const normalized = asRecord(normalizeStringsDeep(original))
  const targetRepo = String(normalized.targetRepo || '').trim()
  const originalImagePath = String(original.imagePath || '').trim()
  const originalPrompt = String(original.promptString || '').trim()

  if (targetRepo === KIND_ROBOTS_REPO) {
    normalized.imagePath = normalizeKindRobotsImagePath(normalized.imagePath)
  }

  return {
    payload: normalized,
    imagePathChanged:
      targetRepo === KIND_ROBOTS_REPO &&
      String(normalized.imagePath || '') !== originalImagePath,
    promptChanged:
      String(normalized.promptString || '') !== originalPrompt,
  }
}
