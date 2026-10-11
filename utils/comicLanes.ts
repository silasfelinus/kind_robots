// /utils/comicLanes.ts
//
// Comic Studio render lanes (comic-creator/t-013). A lane is one way of rendering a
// slot: an enqueue engine plus, for the SDXL family, a checkpoint Resource path.
// Every slot renders once per lane so Silas can vet the same subject side by side.
//
// Lanes deliberately carry no steps, cfg or sampler by default: /api/art/enqueue
// applies the checkpoint family's measured sampler profile (utils/checkpointProfiles.ts)
// when they are absent, and the distilled engines clamp to their own cadence. A lane
// sets them only to try a checkpoint author's recommended settings. The scheduler
// always stays the family profile's: enqueue does not forward one for comfy.
//
// Exactly one active lane is the series' primary (house) lane: the checkpoint the
// comic is drawn in. Silas, 2026-10-04, after a seven-checkpoint bake-off
// (comic-creator/t-018): "arthemy is the winner", so Arthemy Western Art is the
// default primary. It runs the checkpoint author's settings (Euler a, 30 steps,
// CFG 5, plus the author's two style tags): Silas, 2026-10-05, "Yes on house
// settings", after seven of his nine design picks came from them.
// furrytoonmix, the previous house lane, stays available.
//
// Pure: no Prisma, no h3, no app aliases, so the DB-free contract test can import it.
import { assessRequeueSafety } from './quarantinedCheckpoints.js'

export const COMIC_LANE_ENGINES = ['krea2', 'zimage', 'flux2', 'comfy'] as const
export type ComicLaneEngine = (typeof COMIC_LANE_ENGINES)[number]
export type ComicPromptStyle = 'prose' | 'tags'

export type ComicLane = {
  key: string
  label: string
  engine: ComicLaneEngine
  checkpoint?: string | null
  promptStyle: ComicPromptStyle
  prefix?: string | null
  suffix?: string | null
  steps?: number | null
  cfg?: number | null
  sampler?: string | null
  primary?: boolean
  active: boolean
  /**
   * Character LoRAs for this lane's checkpoint (comic-creator t-016, Silas 2026-10-11:
   * "These Loras should be the default"). Each one rides on a render only when the
   * render's own prompt names that character, so a Zuzu-only panel never drags the
   * coyote's trigger word in. SDXL-family lanes only: other engines drop or refuse them.
   */
  castLoras?: ComicCastLora[]
}

export type ComicCastLora = {
  /** The character, e.g. "zuzu"; for people reading the lane JSON. */
  key: string
  /** Kind Robots LoRA Resource id. */
  resourceId: number
  /** The trained trigger word. Always counts as a match. */
  trigger?: string | null
  /** Words or phrases in a prompt that mean this character is in the picture. */
  match: string[]
  /** Strength when this is the only character LoRA in the render. Default 0.8. */
  strength?: number | null
  /**
   * false: this LoRA fuses with any second one (Zuzu drew two koalas and lent the
   * fennec his hat in zuzu-gamebook ROUND-12), so a render naming this character
   * alongside another gets no character LoRAs at all.
   */
  stacks?: boolean | null
}

export const COMIC_CAST_LORA_DEFAULT_STRENGTH = 0.8
/** Two or more character LoRAs in one render each drop to this share of their strength. */
export const COMIC_CAST_LORA_SHARED_SCALE = 0.75
/** At most this many character LoRAs ride on one render (the job cap is 6). */
export const COMIC_CAST_LORA_MAX_PER_RENDER = 4

export const COMIC_LANE_SAMPLERS = [
  'euler',
  'euler_ancestral',
  'dpmpp_2m',
  'dpmpp_2m_sde',
  'dpmpp_3m_sde',
  'dpmpp_sde',
  'dpm_2',
  'dpm_2_ancestral',
  'heun',
  'lms',
  'ddim',
] as const

const ILLUSTRIOUS_PREFIX =
  'masterpiece, best quality, amazing quality, absurdres, very aesthetic'
const WESTERN_TAG_SUFFIX =
  'western, dusty, painterly, dramatic lighting, gritty'

export const DEFAULT_COMIC_LANES: ComicLane[] = [
  {
    key: 'il-arthemy',
    label: 'IL Arthemy Western Art',
    engine: 'comfy',
    checkpoint: 'Illustrious/arthemyWesternArt_v30.safetensors',
    promptStyle: 'tags',
    prefix: `${ILLUSTRIOUS_PREFIX}, toon (style), western comics (style)`,
    suffix: WESTERN_TAG_SUFFIX,
    steps: 30,
    cfg: 5,
    sampler: 'euler_ancestral',
    primary: true,
    active: true,
  },
  {
    key: 'il-furrytoonmix',
    label: 'IL furrytoonmix',
    engine: 'comfy',
    checkpoint: 'Illustrious/furrytoonmix_xlV3.safetensors',
    promptStyle: 'tags',
    prefix: ILLUSTRIOUS_PREFIX,
    suffix: WESTERN_TAG_SUFFIX,
    active: true,
  },
  {
    key: 'zimage-turbo',
    label: 'Z-Image Turbo',
    engine: 'zimage',
    promptStyle: 'prose',
    active: true,
  },
  {
    key: 'il-realism',
    label: 'IL realismIllustriousBy',
    engine: 'comfy',
    checkpoint: 'Illustrious/realismIllustriousBy_v55FP16.safetensors',
    promptStyle: 'tags',
    prefix: `${ILLUSTRIOUS_PREFIX}, realistic`,
    suffix: WESTERN_TAG_SUFFIX,
    // Off by default: in round 3 it drew the anthro cast as human bodies
    // (a nude Zuzu sheet, the child siblings in underwear) despite the negatives.
    active: false,
  },
  {
    key: 'sdxl-nihilmania',
    label: 'SDXL nihilmania',
    engine: 'comfy',
    checkpoint: 'SDXL/sdxlUnstableDiffusers_nihilmania.safetensors',
    promptStyle: 'prose',
    suffix: 'dark moody oil painting, heavy shadows',
    active: true,
  },
  {
    key: 'krea2',
    label: 'Krea 2',
    engine: 'krea2',
    promptStyle: 'prose',
    active: false,
  },
]

export const COMIC_RENDER_SIZES: Record<
  string,
  { width: number; height: number }
> = {
  '1:1': { width: 1024, height: 1024 },
  '4:3': { width: 1152, height: 896 },
  '3:4': { width: 896, height: 1152 },
  '3:2': { width: 1216, height: 832 },
  '2:3': { width: 832, height: 1216 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '21:9': { width: 1536, height: 640 },
}

export const COMIC_ASPECTS = Object.keys(COMIC_RENDER_SIZES)
export const COMIC_MAX_ACTIVE_PER_LANE = 3

function cleanText(value: unknown, max = 4000): string {
  return typeof value === 'string'
    ? value.replace(/\s+/g, ' ').trim().slice(0, max)
    : ''
}

function optionalText(value: unknown, max = 2000): string | null {
  const text = cleanText(value, max)
  return text || null
}

function optionalPositive(value: unknown): number | null {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

export function comicRenderSize(aspect: string | null | undefined): {
  width: number
  height: number
} {
  return COMIC_RENDER_SIZES[String(aspect || '')] ?? COMIC_RENDER_SIZES['1:1']!
}

export function comicCheckpointProblem(checkpoint: string): string | null {
  const assessment = assessRequeueSafety({
    lane: {
      class_type: 'CheckpointLoaderSimple',
      inputs: { ckpt_name: checkpoint },
    },
  })
  if (assessment.action === 'block') return assessment.reason
  if (assessment.action === 'repoint') {
    return `${assessment.from} is quarantined (${assessment.reason}); use ${assessment.to} instead.`
  }
  return null
}

export function normalizeComicLanes(raw: unknown): {
  lanes: ComicLane[]
  errors: string[]
} {
  const errors: string[] = []
  const lanes: ComicLane[] = []
  const seen = new Set<string>()
  const list = Array.isArray(raw) ? raw : []
  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const key = cleanText(record.key, 64).toLowerCase()
    const engine = cleanText(record.engine, 16).toLowerCase() as ComicLaneEngine
    if (!/^[a-z0-9][a-z0-9-]*$/.test(key)) {
      errors.push(
        `Lane key "${key}" must be lowercase letters, digits and hyphens.`,
      )
      continue
    }
    if (seen.has(key)) {
      errors.push(`Lane key "${key}" is used twice.`)
      continue
    }
    if (!COMIC_LANE_ENGINES.includes(engine)) {
      errors.push(`Lane "${key}" has unsupported engine "${engine}".`)
      continue
    }
    const checkpoint = optionalText(record.checkpoint, 512)
    if (engine === 'comfy' && !checkpoint) {
      errors.push(
        `Lane "${key}" needs a checkpoint for the SDXL family engine.`,
      )
      continue
    }
    const problem = checkpoint ? comicCheckpointProblem(checkpoint) : null
    if (problem) {
      errors.push(`Lane "${key}": ${problem}`)
      continue
    }
    seen.add(key)
    lanes.push({
      key,
      label: cleanText(record.label, 80) || key,
      engine,
      checkpoint: engine === 'comfy' ? checkpoint : null,
      promptStyle: record.promptStyle === 'tags' ? 'tags' : 'prose',
      prefix: optionalText(record.prefix),
      suffix: optionalText(record.suffix),
      steps: engine === 'comfy' ? optionalPositive(record.steps) : null,
      cfg: engine === 'comfy' ? optionalPositive(record.cfg) : null,
      sampler:
        engine === 'comfy'
          ? oneOfOrNull(COMIC_LANE_SAMPLERS, record.sampler)
          : null,
      primary: record.primary === true,
      active: record.active !== false,
      ...(engine === 'comfy' ? castLorasField(record.castLoras) : {}),
    })
  }
  return { lanes: settlePrimaryLane(lanes), errors }
}

function castLorasField(raw: unknown): { castLoras?: ComicCastLora[] } {
  const castLoras = normalizeComicCastLoras(raw)
  return castLoras.length ? { castLoras } : {}
}

export function normalizeComicCastLoras(raw: unknown): ComicCastLora[] {
  if (!Array.isArray(raw)) return []
  const out: ComicCastLora[] = []
  const seen = new Set<number>()
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const resourceId = Number(record.resourceId)
    if (
      !Number.isInteger(resourceId) ||
      resourceId <= 0 ||
      seen.has(resourceId)
    )
      continue
    const trigger = optionalText(record.trigger, 64)
    const match = (Array.isArray(record.match) ? record.match : [])
      .map((term) => cleanText(term, 64).toLowerCase())
      .filter(Boolean)
      .slice(0, 12)
    if (!match.length && !trigger) continue
    const strength = Number(record.strength)
    seen.add(resourceId)
    out.push({
      key: cleanText(record.key, 64) || String(resourceId),
      resourceId,
      ...(trigger ? { trigger } : {}),
      match,
      ...(Number.isFinite(strength) && strength > 0 && strength <= 2
        ? { strength }
        : {}),
      ...(record.stacks === false ? { stacks: false } : {}),
    })
    if (out.length >= 12) break
  }
  return out
}

function mentions(text: string, term: string): boolean {
  const escaped = term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return escaped
    ? new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(text)
    : false
}

/**
 * The lane's character LoRAs whose character the text names, as /api/art/enqueue
 * `loras`. One character gets its full strength; two or more each get
 * COMIC_CAST_LORA_SHARED_SCALE of it, so their looks don't bleed together.
 * A character marked `stacks: false` sharing the frame means none: the prompt
 * carries the scene, as it did before the LoRAs.
 */
export function selectComicCastLoras(
  lane: Pick<ComicLane, 'engine' | 'castLoras'>,
  text: string | null | undefined,
): Array<{ resourceId: number; strength: number }> {
  if (lane.engine !== 'comfy' || !lane.castLoras?.length) return []
  const haystack = String(text ?? '').toLowerCase()
  if (!haystack.trim()) return []
  const hits = lane.castLoras
    .filter((cast) =>
      [cast.trigger ?? '', ...cast.match].some(
        (term) => term && mentions(haystack, term.toLowerCase()),
      ),
    )
    .slice(0, COMIC_CAST_LORA_MAX_PER_RENDER)
  if (hits.length > 1 && hits.some((cast) => cast.stacks === false)) return []
  const scale = hits.length > 1 ? COMIC_CAST_LORA_SHARED_SCALE : 1
  return hits.map((cast) => ({
    resourceId: cast.resourceId,
    strength:
      Math.round(
        (cast.strength ?? COMIC_CAST_LORA_DEFAULT_STRENGTH) * scale * 100,
      ) / 100,
  }))
}

function oneOfOrNull<T extends string>(
  values: readonly T[],
  value: unknown,
): T | null {
  const text = cleanText(value, 32).toLowerCase()
  return (values as readonly string[]).includes(text) ? (text as T) : null
}

// Exactly one active lane is primary: the first one marked, else the first active
// SDXL-family lane, else the first active lane. An inactive lane cannot be primary.
function settlePrimaryLane(lanes: ComicLane[]): ComicLane[] {
  const active = lanes.filter((lane) => lane.active)
  const chosen =
    active.find((lane) => lane.primary) ??
    active.find((lane) => lane.engine === 'comfy') ??
    active[0] ??
    null
  return lanes.map((lane) => ({ ...lane, primary: lane === chosen }))
}

export function comicPrimaryLane(lanes: ComicLane[]): ComicLane | null {
  return lanes.find((lane) => lane.primary) ?? null
}

export function orderComicLanes(lanes: ComicLane[]): ComicLane[] {
  return [
    ...lanes.filter((lane) => lane.primary),
    ...lanes.filter((lane) => !lane.primary),
  ]
}

export function parseComicLanes(
  stored: string | null | undefined,
): ComicLane[] {
  try {
    const { lanes } = normalizeComicLanes(JSON.parse(String(stored || '[]')))
    return lanes.length ? lanes : DEFAULT_COMIC_LANES
  } catch {
    return DEFAULT_COMIC_LANES
  }
}

export type ComicPromptSource = {
  promptProse?: string | null
  promptTags?: string | null
  negativePrompt?: string | null
  useSeriesStyle?: boolean | null
}

export type ComicSeriesStyle = {
  styleProse?: string | null
  styleTags?: string | null
  negativeTags?: string | null
}

export function composeComicLanePrompt(
  lane: ComicLane,
  slot: ComicPromptSource,
  series: ComicSeriesStyle = {},
): { prompt: string; negativePrompt: string | null; usedFallback: boolean } {
  const useStyle = slot.useSeriesStyle !== false
  const prose = cleanText(slot.promptProse)
  const tags = cleanText(slot.promptTags)
  const usedFallback = lane.promptStyle === 'tags' && !tags && Boolean(prose)
  const body = lane.promptStyle === 'tags' && tags ? tags : prose
  const style =
    useStyle && lane.promptStyle === 'tags' && tags
      ? cleanText(series.styleTags)
      : useStyle
        ? cleanText(series.styleProse)
        : ''
  const parts =
    lane.promptStyle === 'tags' && tags
      ? [lane.prefix, style, body, lane.suffix]
      : [lane.prefix, body, style, lane.suffix]
  const prompt = parts
    .map((part) => cleanText(part))
    .filter(Boolean)
    .join(', ')
  const negative =
    lane.engine === 'comfy'
      ? cleanText(slot.negativePrompt) || cleanText(series.negativeTags) || null
      : null
  return { prompt, negativePrompt: negative, usedFallback }
}

export type ComicEnqueueBody = {
  engine: ComicLaneEngine
  promptString: string
  negativePrompt?: string
  checkpoint?: string
  width: number
  height: number
  steps?: number
  cfg?: number
  sampler?: string
  isPublic: boolean
  isMature: boolean
  designer: string
  projectSlug: string
  loras?: Array<{ resourceId: number; strength: number }>
}

export const COMIC_PROJECT_SLUG = 'comic-creator'
export const COMIC_DESIGNER = 'Comic Studio'

export function buildComicLaneEnqueueBody(
  lane: ComicLane,
  slot: ComicPromptSource & {
    aspect?: string | null
    castText?: string | null
  },
  series: ComicSeriesStyle & { isPublicArt?: boolean | null } = {},
): ComicEnqueueBody {
  const { prompt, negativePrompt } = composeComicLanePrompt(lane, slot, series)
  const { width, height } = comicRenderSize(slot.aspect)
  // Who is in the picture comes from the slot's own words, never the series style.
  const loras = selectComicCastLoras(
    lane,
    slot.castText ??
      [slot.promptTags, slot.promptProse].filter(Boolean).join(', '),
  )
  return {
    engine: lane.engine,
    promptString: prompt,
    ...(negativePrompt ? { negativePrompt } : {}),
    ...(lane.engine === 'comfy' && lane.checkpoint
      ? { checkpoint: lane.checkpoint }
      : {}),
    width,
    height,
    ...(lane.steps ? { steps: lane.steps } : {}),
    ...(lane.cfg ? { cfg: lane.cfg } : {}),
    ...(lane.engine === 'comfy' && lane.sampler
      ? { sampler: lane.sampler }
      : {}),
    isPublic: Boolean(series.isPublicArt),
    isMature: false,
    designer: COMIC_DESIGNER,
    projectSlug: COMIC_PROJECT_SLUG,
    ...(loras.length ? { loras } : {}),
  }
}

export function comicLaneQueueDecision(activeCount: number): {
  allowed: boolean
  reason: string | null
} {
  return activeCount >= COMIC_MAX_ACTIVE_PER_LANE
    ? {
        allowed: false,
        reason: `This lane already has ${activeCount} renders in flight. Wait for one to finish.`,
      }
    : { allowed: true, reason: null }
}

export function comicLaneForKey(
  lanes: ComicLane[],
  key: string,
): ComicLane | null {
  return lanes.find((lane) => lane.key === key) ?? null
}
