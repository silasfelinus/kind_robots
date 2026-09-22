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
// that keeps an empty picture empty. Stated positively because Krea 2 runs at
// cfg 1, which makes the ComfyUI negative prompt inert (see
// server/api/comfy/krea2/utils/workflow.ts); every constraint has to survive
// inside the positive prompt.
//
// It was NOT stated positively until 2026-09-19, which is the whole point of
// the comment above. "an unpeopled ..." is the positive half and it works;
// "with no bystanders, onlookers, or crowd" then names three kinds of people to
// an engine that cannot act on the "no", and Krea drew them. Every prompt this
// constant touched between 2026-08-08 and now carries that tail, which is why
// the crowds the 2026-08-08 sweep was written to remove kept arriving. One
// adjective does the job the exclusion list was undoing.
//
// The noun was "frame" until 2026-09-21, and that was the next bug in the
// chain: this constant is appended to object and product prompts wholesale, so
// it taught Krea to draw a picture frame on every one of them. "Frame" means a
// physical object to a caption model before it means a boundary -- see the
// frame-noun rule in artPromptContract.ts, which now rejects it. "Picture" is
// the house word for the boundary and carries none of that risk; the four live
// Facet prompts carrying the old wording came from here.
export const DEFAULT_UNPEOPLED_ART_DIRECTION =
  'an unpeopled picture, the subject alone, the space around it bare and deserted'

const VAGUE_ART_DIRECTION =
  /\b(?:(?:rich|cohesive|friendly)\s+)?Kind Robots\s+(?:visual\s+)?(?:style|language)\b/gi

// Exact pre-2026-08-08 wording that shipped before the prompt contract existed.
// Requeueing those rows verbatim makes them fail forever at claim time. Keep
// this migration evidence-led and narrow: these are the phrases from the
// production failures and the commits that replaced their producers (#1606,
// #1609, #1622), not a second general-purpose prompt sanitizer.
const LEGACY_ASSET_ART_DIRECTION =
  'detailed mature western animation with multidimensional worldbuilding, expressive anatomy and faces, confident ink-like linework, dimensional shapes, rich controlled color, cinematic lighting, tactile environments, and clear readable silhouettes; cast characters naturally across many species, ages, body sizes, body shapes, gender presentations, and levels of conventional attractiveness; include robots only when the subject or scene explicitly calls for them'

const LEGACY_CARD_COMPOSITION = /\b(?:2:3\s+portrait\s+)?card composition\b/gi
const LEGACY_TREASURE_CARD = /\btreasure[- ]card illustration\b/gi
const LEGACY_ABILITY_CARD = /\bability[- ]card illustration\b/gi

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
 * Repair only prompt wording that is known to have shipped before the current
 * prompt contract. The original producers are already fixed; this exists so
 * explicitly reviewed FAILED rows can cross the newer claim-time gate instead
 * of cycling back to FAILED unchanged.
 */
/*
 * The "frame" migration (2026-09-21).
 *
 * Krea paints "frame" as a physical picture frame in every sense but one, so
 * server/utils/artPromptContract.ts now rejects it. That gate applies to
 * REQUEUES too, and the phrases below are already sitting in stored rows --
 * DEFAULT_UNPEOPLED_ART_DIRECTION alone put one on every object and product
 * prompt in the app. Without this table those rows fail at claim time forever,
 * which is the exact failure mode LEGACY_ASSET_ART_DIRECTION above exists to
 * prevent.
 *
 * Two groups, and the split is the whole reason this is a table and not a
 * global "frame" -> "picture" replace. Such a replace would rewrite the corn
 * dolly's wicker frame, the gilding card's carved frame and the gallery mount
 * asset -- three prompts whose subject IS a frame and which render correctly
 * today.
 *
 *   COMPOSITION: generic, producer-generated, and safe to match anywhere,
 *   because none of these phrasings can describe a frame that is really in the
 *   scene. "picture" is the house word already used by every variant
 *   composition ("A square picture with the subject large and centred").
 *
 *   ANATOMY: the eleven curated embodiment prompts that described a body as a
 *   "frame" and rendered an empty frame instead (ArtJobs 30116 "Wasted but
 *   Working" and 30117 "Rebuilt" are the two Silas caught it from). Listed
 *   exactly, not by pattern, for the reason the comment on
 *   LEGACY_ASSET_ART_DIRECTION gives: these are the strings that shipped.
 *   utils/seeds/facetEmbodimentValues.ts carries the same corrections, so a
 *   seed re-run and a requeue arrive at the same text.
 */
const LEGACY_FRAME_COMPOSITION: Array<[RegExp, string]> = [
  /*
   * "in frame" with no article is the film idiom and nothing else -- a frame
   * that is really in the scene is always "THE frame" or "A frame" ("a hand on
   * the frame", "nothing hangs from the frame"). That one pattern covers
   * "one object alone in frame", "every surface in frame", "anywhere in frame"
   * and "foreground detail low in frame" together.
   */
  [/\bin frame\b/gi, 'in the picture'],
  [/\ban unpeopled frame\b/gi, 'an unpeopled picture'],
  [/\bfilling the frame\b/gi, 'filling the picture'],
  [/\balone in the frame\b/gi, 'alone in the picture'],
  [/\bthe whole frame\b/gi, 'the whole picture'],
  [/\bthe same frame\b/gi, 'the same picture'],
  [/\bedge of the frame\b/gi, 'edge of the picture'],
  [/\bedges of the frame\b/gi, 'edges of the picture'],
]

const LEGACY_FRAME_ANATOMY: Array<[string, string]> = [
  ['A thin frame with prominent collarbones', 'A thin body with prominent collarbones'],
  ['An asymmetric frame, one limb visibly different', 'An asymmetric body, one limb visibly different'],
  ['A wide, softly rounded frame, full upper arms', 'A wide, softly rounded body, full upper arms'],
  ['A short, deep-bodied frame planted wide', 'A short, deep-bodied build planted wide'],
  ['An elongated frame with prominent elbows', 'An elongated body with prominent elbows'],
  ['An unremarkable sturdy frame, visible forearm tendon', 'An unremarkable sturdy body, visible forearm tendon'],
  ['A rounded, unmuscled frame, sloped shoulders', 'A rounded, unmuscled body, sloped shoulders'],
  ['An adolescent face on an outsized frame', 'An adolescent face on an outsized body'],
  ['frame settled and shrunken', 'body settled and shrunken'],
  ['shoulders and frame giving nothing away', 'shoulders and body giving nothing away'],
]

/** Rewrite every shipped "frame" phrasing that means no frame at all. */
export function repairFramePrompt(value: string): string {
  let out = value
  for (const [from, to] of LEGACY_FRAME_ANATOMY) out = out.split(from).join(to)
  for (const [pattern, replacement] of LEGACY_FRAME_COMPOSITION) {
    out = out.replace(pattern, replacement)
  }
  return out
}

export function repairLegacyArtPrompt(value: string): string {
  return repairFramePrompt(value)
    .replace(LEGACY_ASSET_ART_DIRECTION, DEFAULT_ASSET_ART_STYLE)
    .replace(LEGACY_CARD_COMPOSITION, 'vertical 2:3 portrait composition')
    .replace(LEGACY_TREASURE_CARD, 'object illustration')
    .replace(LEGACY_ABILITY_CARD, 'concept illustration')
    .replace(/\s+/g, ' ')
    .trim()
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
  return repairLegacyArtPrompt(
    value.replace(VAGUE_ART_DIRECTION, DEFAULT_ASSET_ART_STYLE),
  )
}

/**
 * The keys whose strings are PROMPT TEXT, and therefore the only ones legacy
 * prompt repair may touch.
 *
 * This is an allowlist rather than a denylist because the two failure modes are
 * not symmetrical. A prompt key missing from this set simply goes unrepaired --
 * the same state every payload was in before the prompt contract existed, and
 * recoverable by editing the row. A non-prompt key that a denylist forgot gets
 * REWRITTEN, and the repair ends with `.replace(/\s+/g, ' ')`, which silently
 * renames any model file whose name contains two spaces.
 *
 * That is not hypothetical. ArtJob 26024 asked for
 * `Flux/NSFW/dtsvFLUX _ Blowjob  Deepthroat FLUX.safetensors` (Resource 1040,
 * two spaces, exactly as the file sits on disk) and reached ComfyUI with one,
 * so it failed with "no matching file" against a model that was present the
 * whole time (2026-09-16, surfaced 2026-09-20). Its own queueEdit recorded
 * `loraPathChanged: false` while the path changed underneath it.
 *
 * Only the two callers of this function are affected -- /api/art/queue and
 * /api/art/queue/reenqueue-failed -- which is why the other four catalog rows
 * holding collapsible whitespace (1979, 2500, 3051, 3320) still have previews:
 * the probe lane enqueues through /api/art/enqueue, which does not normalize.
 * That narrows the blast radius without making it benign, because the affected
 * path is the REPAIR path: a job re-enqueued after any failure had its LoRA
 * filename corrupted by the attempt to fix it.
 *
 * `text` and `wildcard_text` are the baked workflow copies read back by
 * extractRenderRequest (CLIPTextEncode / ImpactWildcardEncode), so the graph's
 * prompt and the payload's stay in sync through a repair.
 */
const PROMPT_TEXT_KEYS = new Set([
  'artPrompt',
  'basePromptString',
  'negativePrompt',
  'normalizedPrompt',
  'populated_text',
  'prompt',
  'promptString',
  'text',
  'wildcard_text',
])

function normalizeStringsDeep(value: unknown, key = ''): unknown {
  if (Array.isArray(value)) {
    return value.map((child) => normalizeStringsDeep(child, key))
  }

  if (!value || typeof value !== 'object') {
    return typeof value === 'string' && PROMPT_TEXT_KEYS.has(key)
      ? replaceVagueArtDirection(value)
      : value
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([childKey, child]) => [
      childKey,
      normalizeStringsDeep(child, childKey),
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
