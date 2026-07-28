// /server/utils/artJobRetry.ts
import {
  parseArtJobPayload,
  type ArtJobPayloadRecord,
} from './artJobPayload'
import { ltxFrameCount } from '../api/comfy/ltx/utils/imageToVideoWorkflow'
import { wanFrameCount } from '../api/comfy/wan/utils/imageToVideoWorkflow'

export type ArtJobRetryMode = 'NEW_OUTPUT' | 'OVERWRITE'

export const ART_JOB_RETRY_MODES = new Set<ArtJobRetryMode>([
  'NEW_OUTPUT',
  'OVERWRITE',
])

const SEED_KEYS = new Set(['seed', 'noise_seed'])
const CURRENT_FLUX_T5 = 't5xxl_fp8_e4m3fn_scaled.safetensors'
const CURRENT_FLUX_CLIP_L = 'clip_l.safetensors'

function asRecord(value: unknown): ArtJobPayloadRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as ArtJobPayloadRecord
}

function nextSeed(): number {
  return Math.floor(Math.random() * 2_147_483_647)
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
  basePromptString?: string | null
  facetIds?: number[] | null
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
  durationSeconds?: number | null
  fps?: number | null
  loop?: boolean | null
}

const SAMPLER_NODE_TYPES = new Set([
  'KSampler',
  'KSamplerAdvanced',
  'SamplerCustom',
])
const CHECKPOINT_KEYS = ['ckpt_name', 'unet_name', 'model_name']
const VIDEO_NODE_TYPES = new Set([
  'LTXVConditioning',
  'LTXVImgToVideo',
  'WanImageToVideo',
  'ImageResize+',
  'ImageScale',
  'CreateVideo',
])

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function resolveVideoModel(
  payload: ArtJobPayloadRecord,
  workflow: ArtJobPayloadRecord,
): 'ltx' | 'wan' | null {
  const video = asRecord(payload.video)
  const model = stringValue(video.model).toLowerCase()
  if (model === 'ltx' || model === 'wan') return model
  for (const node of Object.values(workflow)) {
    const classType = stringValue(asRecord(node).class_type)
    if (classType === 'WanImageToVideo') return 'wan'
    if (classType === 'LTXVImgToVideo') return 'ltx'
  }
  return String(payload.media || '').toLowerCase() === 'video' ? 'ltx' : null
}

function workflowVideoNumber(
  workflow: ArtJobPayloadRecord,
  classTypes: Set<string>,
  keys: string[],
): number | null {
  for (const node of Object.values(workflow)) {
    const record = asRecord(node)
    const classType = stringValue(record.class_type)
    if (!classTypes.has(classType)) continue
    const inputs = asRecord(record.inputs)
    for (const key of keys) {
      const value = num(inputs[key])
      if (value !== null) return value
    }
  }
  return null
}

function normalizeLegacyComfyWorkflow(
  payload: ArtJobPayloadRecord,
): ArtJobPayloadRecord {
  const workflow = asRecord(payload.workflow)
  if (!Object.keys(workflow).length) return payload

  for (const node of Object.values(workflow)) {
    const record = asRecord(node)
    const classType = stringValue(record.class_type)
    const inputs = asRecord(record.inputs)

    if (classType === 'ImageResize+') {
      record.class_type = 'ImageScale'
      record.inputs = {
        image: inputs.image,
        upscale_method: stringValue(inputs.interpolation) || 'lanczos',
        width: num(inputs.width) ?? 0,
        height: num(inputs.height) ?? 0,
        crop: 'disabled',
      }
      continue
    }

    if (
      classType === 'DualCLIPLoader' &&
      stringValue(inputs.type).toLowerCase() === 'flux'
    ) {
      inputs.clip_name1 = CURRENT_FLUX_T5
      inputs.clip_name2 = CURRENT_FLUX_CLIP_L
      record.inputs = inputs
    }
  }

  payload.workflow = workflow
  return payload
}

export function applyArtJobOverrides(
  payload: ArtJobPayloadRecord,
  overrides: ArtJobOverrides | null | undefined,
): ArtJobPayloadRecord {
  normalizeLegacyComfyWorkflow(payload)
  if (!overrides) return payload

  const promptString =
    overrides.promptString?.replace(/\s+/g, ' ').trim() || null
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
  const durationOverride = num(overrides.durationSeconds)
  const fpsOverride = num(overrides.fps)
  const loopOverride =
    typeof overrides.loop === 'boolean' ? overrides.loop : null

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
  const video = asRecord(payload.video)
  const videoModel = resolveVideoModel(payload, workflow)
  const currentFps =
    num(video.fps) ??
    workflowVideoNumber(
      workflow,
      new Set(['LTXVConditioning', 'CreateVideo']),
      ['frame_rate', 'fps'],
    )
  const currentDuration = num(video.durationSeconds)
  const nextFps =
    fpsOverride !== null ? clamp(fpsOverride, 1, 60) : currentFps
  const nextDuration =
    durationOverride !== null
      ? clamp(durationOverride, 0.25, 30)
      : currentDuration
  const nextFrames =
    videoModel && nextFps !== null && nextDuration !== null
      ? videoModel === 'wan'
        ? wanFrameCount(nextDuration, nextFps)
        : ltxFrameCount(nextDuration, nextFps)
      : null

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

      if (videoModel && VIDEO_NODE_TYPES.has(classType)) {
        if (width !== null && 'width' in inputs) inputs.width = width
        if (height !== null && 'height' in inputs) inputs.height = height
      }

      if (nextFps !== null) {
        if (classType === 'LTXVConditioning' && 'frame_rate' in inputs) {
          inputs.frame_rate = nextFps
        }
        if (classType === 'CreateVideo' && 'fps' in inputs) {
          inputs.fps = nextFps
        }
      }

      if (
        nextFrames !== null &&
        (classType === 'LTXVImgToVideo' ||
          classType === 'WanImageToVideo') &&
        'length' in inputs
      ) {
        inputs.length = nextFrames
      }

      if (SAMPLER_NODE_TYPES.has(classType)) {
        if (steps !== null && 'steps' in inputs) inputs.steps = steps
        if (cfg !== null && 'cfg' in inputs) inputs.cfg = cfg
        if (seed !== null && 'seed' in inputs) inputs.seed = seed
        if (sampler && 'sampler_name' in inputs) {
          inputs.sampler_name = sampler
        }
        if (scheduler && 'scheduler' in inputs) inputs.scheduler = scheduler
        if (denoise !== null && 'denoise' in inputs) inputs.denoise = denoise
      }

      if (
        steps !== null &&
        'steps' in inputs &&
        classType === 'BasicScheduler'
      ) {
        inputs.steps = steps
      }
      if (seed !== null && 'noise_seed' in inputs) inputs.noise_seed = seed
      if (guidance !== null && 'guidance' in inputs) {
        inputs.guidance = guidance
      }
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

  if (videoModel) {
    payload.media = 'video'
    video.model = videoModel
    if (width !== null) video.width = width
    if (height !== null) video.height = height
    if (nextFps !== null) video.fps = nextFps
    if (nextDuration !== null) video.durationSeconds = nextDuration
    if (nextFrames !== null) video.frames = nextFrames
    if (loopOverride !== null) video.loop = loopOverride
    payload.video = video
  }

  return payload
}

export function prepareArtJobRetryPayload(
  rawPayload: unknown,
  sourceJobId: number,
  sourceArtImageId: number | null,
  mode: ArtJobRetryMode,
  refreshSeed: boolean,
): ArtJobPayloadRecord {
  const cloned = normalizeLegacyComfyWorkflow(
    structuredClone(parseArtJobPayload(rawPayload)),
  )
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
