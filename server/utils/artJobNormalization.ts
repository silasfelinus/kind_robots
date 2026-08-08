import { createError } from 'h3'
import {
  parseArtJobPayload,
  type ArtJobPayloadRecord,
} from './artJobPayload'

export const KIND_ROBOTS_REPO = 'silasfelinus/kind_robots'

// The medium/rendering half of the house look. Safe for every subject, because
// it describes how a thing is drawn, not what is in frame.
export const DEFAULT_ASSET_ART_STYLE =
  'detailed mature western animation with multidimensional worldbuilding, expressive anatomy and faces, confident ink-like linework, dimensional shapes, rich controlled color, cinematic lighting, tactile environments, and clear readable silhouettes'

// The casting half. This used to be welded onto the style above and appended to
// every prompt unconditionally, including prompts for inanimate objects. Its
// original wording ("...include robots only when the subject or scene
// explicitly calls for them") assumes a reader who can evaluate a condition.
// Diffusion models cannot: Krea 2 reads "characters ... many species, ages,
// body sizes, body shapes, gender presentations" as the densest concrete noun
// phrase in the prompt and paints a crowd. That is how a Reward called
// "Tidefortune Ladle" rendered as fifteen people and no ladle (2026-08-08).
//
// Append this ONLY when the frame genuinely contains people. Prompt producers
// that know their subject should opt in; `replaceVagueArtDirection` below
// cannot know, so it deliberately does not.
export const DEFAULT_CAST_ART_DIRECTION =
  'cast the people who appear naturally across many species, ages, body sizes, body shapes, gender presentations, and levels of conventional attractiveness'

// For object, product, landscape, and architecture subjects — the counterweight
// that keeps an empty frame empty. Stated positively because Krea 2 runs at
// cfg 1, which makes the ComfyUI negative prompt inert (see
// server/api/comfy/krea2/utils/workflow.ts); every constraint has to survive
// inside the positive prompt.
export const DEFAULT_UNPEOPLED_ART_DIRECTION =
  'an unpeopled frame — the subject stands alone with no bystanders, onlookers, or crowd'

const VAGUE_ART_DIRECTION =
  /\b(?:(?:rich|cohesive|friendly)\s+)?Kind Robots\s+(?:visual\s+)?(?:style|language)\b/gi

function asRecord(value: unknown): ArtJobPayloadRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as ArtJobPayloadRecord
}

function unsafePath(value: string): boolean {
  return value
    .replace(/\\/g, '/')
    .split(/[?#]/, 1)[0]!
    .split('/')
    .some((part) => part === '..')
}

function cleanPath(value: unknown): string {
  let path = String(value || '').trim().replace(/\\/g, '/')
  if (!path) return ''

  if (unsafePath(path)) {
    throw createError({
      statusCode: 400,
      message: `Unsafe Kind Robots imagePath "${path}".`,
    })
  }

  if (/^https?:\/\//i.test(path)) {
    try {
      path = decodeURIComponent(new URL(path).pathname)
    } catch {
      path = path.split('?', 1)[0]!.split('#', 1)[0]!
    }
  } else {
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

/**
 * Swap the legacy "Kind Robots visual style" filler — which gives an image model
 * no visual information — for the concrete house style.
 *
 * This substitutes the STYLE only. It runs over arbitrary prompt strings with no
 * knowledge of whether the subject is a person, an object, or a landscape, so it
 * must not inject a casting instruction: a missing diversity nudge on a legacy
 * prompt is recoverable, a crowd of people standing in for a ladle is not.
 * Producers that know their subject has people append
 * DEFAULT_CAST_ART_DIRECTION themselves.
 */
export function replaceVagueArtDirection(value: string): string {
  return value
    .replace(VAGUE_ART_DIRECTION, DEFAULT_ASSET_ART_STYLE)
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
