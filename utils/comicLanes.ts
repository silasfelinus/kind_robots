// /utils/comicLanes.ts
//
// Comic Studio render lanes (comic-creator/t-013). A lane is one way of rendering a
// slot: an enqueue engine plus, for the SDXL family, a checkpoint Resource path.
// Every slot renders once per lane so Silas can vet the same subject side by side.
//
// Lanes deliberately carry no steps or cfg by default: /api/art/enqueue applies the
// checkpoint family's measured sampler profile (utils/checkpointProfiles.ts) when
// they are absent, and the distilled engines clamp to their own cadence.
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
  active: boolean
}

const ILLUSTRIOUS_PREFIX =
  'masterpiece, best quality, amazing quality, absurdres, very aesthetic'
const WESTERN_TAG_SUFFIX =
  'western, dusty, painterly, dramatic lighting, gritty'

export const DEFAULT_COMIC_LANES: ComicLane[] = [
  {
    key: 'zimage-turbo',
    label: 'Z-Image Turbo',
    engine: 'zimage',
    promptStyle: 'prose',
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
    key: 'il-realism',
    label: 'IL realismIllustriousBy',
    engine: 'comfy',
    checkpoint: 'Illustrious/realismIllustriousBy_v55FP16.safetensors',
    promptStyle: 'tags',
    prefix: `${ILLUSTRIOUS_PREFIX}, realistic`,
    suffix: WESTERN_TAG_SUFFIX,
    active: true,
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
      steps: optionalPositive(record.steps),
      cfg: optionalPositive(record.cfg),
      active: record.active !== false,
    })
  }
  return { lanes, errors }
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
  isPublic: boolean
  isMature: boolean
  designer: string
  projectSlug: string
}

export const COMIC_PROJECT_SLUG = 'comic-creator'
export const COMIC_DESIGNER = 'Comic Studio'

export function buildComicLaneEnqueueBody(
  lane: ComicLane,
  slot: ComicPromptSource & { aspect?: string | null },
  series: ComicSeriesStyle & { isPublicArt?: boolean | null } = {},
): ComicEnqueueBody {
  const { prompt, negativePrompt } = composeComicLanePrompt(lane, slot, series)
  const { width, height } = comicRenderSize(slot.aspect)
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
    isPublic: Boolean(series.isPublicArt),
    isMature: false,
    designer: COMIC_DESIGNER,
    projectSlug: COMIC_PROJECT_SLUG,
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
