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

// Settings a human can change when re-queuing a failed or completed job from
// the ArtJobs UI, instead of blindly re-running the frozen payload. Only the
// keys present are applied; the rest of the render spec is preserved.
export type ArtJobOverrides = {
  steps?: number | null
  cfg?: number | null
  seed?: number | null
  sampler?: string | null
  scheduler?: string | null
  checkpoint?: string | null
  negativePrompt?: string | null
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

// Apply overrides in place to a cloned generation payload. Handles both the
// graph engines (patches KSampler / loader / negative-encode nodes inside
// payload.workflow) and the raw A1111 path (top-level keys).
export function applyArtJobOverrides(
  payload: ArtJobPayloadRecord,
  overrides: ArtJobOverrides | null | undefined,
): ArtJobPayloadRecord {
  if (!overrides) return payload

  const steps = num(overrides.steps)
  const cfg = num(overrides.cfg)
  const seed = num(overrides.seed)
  const sampler = overrides.sampler?.trim() || null
  const scheduler = overrides.scheduler?.trim() || null
  const checkpoint = overrides.checkpoint?.trim() || null
  const negativePrompt =
    typeof overrides.negativePrompt === 'string'
      ? overrides.negativePrompt
      : null

  const workflow = asRecord(payload.workflow)
  const hasWorkflow = Object.keys(workflow).length > 0

  if (hasWorkflow) {
    for (const node of Object.values(workflow)) {
      const record = asRecord(node)
      const classType = String(record.class_type || '')
      const inputs = asRecord(record.inputs)
      const meta = asRecord(record._meta)

      if (SAMPLER_NODE_TYPES.has(classType)) {
        if (steps !== null && 'steps' in inputs) inputs.steps = steps
        if (cfg !== null && 'cfg' in inputs) inputs.cfg = cfg
        if (seed !== null && 'seed' in inputs) inputs.seed = seed
        if (sampler && 'sampler_name' in inputs) inputs.sampler_name = sampler
        if (scheduler && 'scheduler' in inputs) inputs.scheduler = scheduler
      }
      // Advanced-sampler graphs split these across dedicated nodes.
      if (steps !== null && 'steps' in inputs && classType === 'BasicScheduler')
        inputs.steps = steps
      if (seed !== null && 'noise_seed' in inputs) inputs.noise_seed = seed
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

  // Raw A1111 path (and a convenience mirror for graph jobs).
  if (steps !== null) payload.steps = steps
  if (cfg !== null) payload.cfg = cfg
  if (seed !== null) payload.seed = seed
  if (sampler) payload.sampler = sampler
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
