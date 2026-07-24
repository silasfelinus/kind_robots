// /server/utils/artJobRetry.ts
import {
  parseArtJobPayload,
  type ArtJobPayloadRecord,
} from './artJobPayload'

export type ArtJobRetryMode = 'NEW_OUTPUT' | 'OVERWRITE'

export const ART_JOB_RETRY_MODES = new Set<ArtJobRetryMode>([
  'NEW_OUTPUT',
  'OVERWRITE',
])

const SEED_KEYS = new Set(['seed', 'noise_seed'])

function asRecord(value: unknown): ArtJobPayloadRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as ArtJobPayloadRecord
}

function nextSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000_000_000)
}

function refreshConcreteSeeds(value: unknown, key = ''): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => refreshConcreteSeeds(item))
  }

  if (!value || typeof value !== 'object') {
    if (SEED_KEYS.has(key)) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        return nextSeed()
      }
      if (
        typeof value === 'string' &&
        value.trim() &&
        Number.isFinite(Number(value)) &&
        Number(value) >= 0
      ) {
        return String(nextSeed())
      }
    }
    return value
  }

  return Object.fromEntries(
    Object.entries(value as ArtJobPayloadRecord).map(([childKey, child]) => [
      childKey,
      refreshConcreteSeeds(child, childKey),
    ]),
  )
}

function replaceExactPrompt(
  value: unknown,
  oldPrompt: string,
  nextPrompt: string,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => replaceExactPrompt(item, oldPrompt, nextPrompt))
  }

  if (!value || typeof value !== 'object') {
    if (
      typeof value === 'string' &&
      oldPrompt &&
      value.replace(/\s+/g, ' ').trim() === oldPrompt
    ) {
      return nextPrompt
    }
    return value
  }

  return Object.fromEntries(
    Object.entries(value as ArtJobPayloadRecord).map(([key, child]) => [
      key,
      replaceExactPrompt(child, oldPrompt, nextPrompt),
    ]),
  )
}

export type ArtJobOverrides = {
  promptString?: string | null
  negativePrompt?: string | null
  width?: number | null
  height?: number | null
  steps?: number | null
  cfg?: number | null
  guidance?: number | null
  denoise?: number | null
  seed?: number | null
  sampler?: string | null
  scheduler?: string | null
  checkpoint?: string | null
}

const SAMPLER_NODE_TYPES = new Set([
  'KSampler',
  'KSamplerAdvanced',
  'SamplerCustom',
])
const CHECKPOINT_KEYS = ['ckpt_name', 'unet_name', 'model_name']

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function applyArtJobOverrides(
  payload: ArtJobPayloadRecord,
  overrides: ArtJobOverrides | null | undefined,
): ArtJobPayloadRecord {
  if (!overrides) return payload

  const promptString = overrides.promptString?.replace(/\s+/g, ' ').trim() || null
  const negativePrompt =
    typeof overrides.negativePrompt === 'string'
      ? overrides.negativePrompt
      : null
  const width = num(overrides.width)
  const height = num(overrides.height)
  const steps = num(overrides.steps)
  const cfg = num(overrides.cfg)
  const guidance = num(overrides.guidance)
  const denoise = num(overrides.denoise)
  const seed = num(overrides.seed)
  const sampler = overrides.sampler?.trim() || null
  const scheduler = overrides.scheduler?.trim() || null
  const checkpoint = overrides.checkpoint?.trim() || null

  if (promptString) {
    const oldPrompt = String(payload.promptString || '')
      .replace(/\s+/g, ' ')
      .trim()
    const replaced = replaceExactPrompt(payload, oldPrompt, promptString)
    Object.assign(payload, asRecord(replaced))
    payload.promptString = promptString
  }

  const workflow = asRecord(payload.workflow)
  const hasWorkflow = Object.keys(workflow).length > 0

  if (hasWorkflow) {
    for (const node of Object.values(workflow)) {
      const record = asRecord(node)
      const classType = String(record.class_type || '')
      const inputs = asRecord(record.inputs)
      const meta = asRecord(record._meta)

      if (classType === 'EmptyLatentImage') {
        if (width !== null && 'width' in inputs) inputs.width = width
        if (height !== null && 'height' in inputs) inputs.height = height
      }

      if (SAMPLER_NODE_TYPES.has(classType)) {
        if (steps !== null && 'steps' in inputs) inputs.steps = steps
        if (cfg !== null && 'cfg' in inputs) inputs.cfg = cfg
        if (seed !== null && 'seed' in inputs) inputs.seed = seed
        if (sampler && 'sampler_name' in inputs) inputs.sampler_name = sampler
        if (scheduler && 'scheduler' in inputs) inputs.scheduler = scheduler
        if (denoise !== null && 'denoise' in inputs) inputs.denoise = denoise
      }

      if (steps !== null && 'steps' in inputs && classType === 'BasicScheduler') {
        inputs.steps = steps
      }
      if (seed !== null && 'noise_seed' in inputs) inputs.noise_seed = seed
      if (guidance !== null && 'guidance' in inputs) inputs.guidance = guidance
      if (denoise !== null && 'denoise' in inputs) inputs.denoise = denoise

      if (checkpoint) {
        for (const key of CHECKPOINT_KEYS) {
          if (key in inputs) inputs[key] = checkpoint
        }
      }

      if (
        negativePrompt !== null &&
        classType === 'CLIPTextEncode' &&
        String(meta.title || '')
          .toLowerCase()
          .includes('negative')
      ) {
        inputs.text = negativePrompt
      }

      record.inputs = inputs
    }
    payload.workflow = workflow
  }

  if (width !== null) payload.width = width
  if (height !== null) payload.height = height
  if (steps !== null) payload.steps = steps
  if (cfg !== null) payload.cfg = cfg
  if (guidance !== null) payload.guidance = guidance
  if (denoise !== null) payload.denoise = denoise
  if (seed !== null) payload.seed = seed
  if (sampler) payload.sampler = sampler
  if (scheduler) payload.scheduler = scheduler
  if (checkpoint) payload.checkpoint = checkpoint
  if (negativePrompt !== null) payload.negativePrompt = negativePrompt

  return payload
}

export function prepareArtJobRetryPayload(
  rawPayload: unknown,
  sourceJobId: number,
  sourceArtImageId: number | null,
  mode: ArtJobRetryMode,
  refreshSeed: boolean,
): ArtJobPayloadRecord {
  const cloned = structuredClone(parseArtJobPayload(rawPayload))
  const previousRetry = asRecord(cloned.retry)
  const rootJobId = Number(previousRetry.rootJobId) || sourceJobId

  delete cloned.curation

  const generationPayload = refreshSeed
    ? (refreshConcreteSeeds(cloned) as ArtJobPayloadRecord)
    : cloned

  generationPayload.retry = {
    mode,
    sourceJobId,
    rootJobId,
    targetArtImageId: mode === 'OVERWRITE' ? sourceArtImageId : null,
    refreshSeed,
    requestedAt: new Date().toISOString(),
  }

  return generationPayload
}
