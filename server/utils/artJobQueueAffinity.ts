// /server/utils/artJobQueueAffinity.ts

type JsonRecord = Record<string, unknown>

export type ArtJobAffinityCandidate = {
  id: number
  engine: string
  payload: unknown
  priority: number
}

export type SmartQueueSelection<T extends ArtJobAffinityCandidate> = {
  candidate: T | null
  affinityMatched: boolean
  bypassedCount: number
  preferredAffinity: string | null
  selectedAffinity: string | null
}

const MODEL_RESOURCE_KEYS = new Set([
  'checkpoint',
  'checkpoint_name',
  'ckpt_name',
  'clip_name',
  'clip_name1',
  'clip_name2',
  'clip_name3',
  'control_net_name',
  'controlnet_name',
  'diffusion_model',
  'ipadapter_file',
  'lora_name',
  'model_name',
  'sd_model_checkpoint',
  'style_model_name',
  'unet_name',
  'upscale_model',
  'upscale_model_name',
  'vae_name',
])

const MODEL_LOADER_CLASS_PATTERN =
  /(checkpoint|unet|clip|vae|lora|controlnet|ipadapter|stylemodel|upscalemodel|modelloader)/i

const DYNAMIC_LOADER_INPUT_KEYS = new Set([
  'batch_size',
  'denoise',
  'height',
  'image',
  'images',
  'latent',
  'negative',
  'noise',
  'noise_seed',
  'positive',
  'prompt',
  'seed',
  'steps',
  'text',
  'width',
])

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as JsonRecord
}

function stableValue(value: unknown): unknown {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  if (Array.isArray(value)) {
    if (
      value.length === 2 &&
      (typeof value[0] === 'string' || typeof value[0] === 'number') &&
      typeof value[1] === 'number'
    ) {
      return '@link'
    }

    return value.map((item) => stableValue(item))
  }

  const record = asRecord(value)
  if (!record) return String(value)

  return Object.fromEntries(
    Object.entries(record)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stableValue(child)]),
  )
}

function collectNamedResources(
  value: unknown,
  resources: Set<string>,
  depth = 0,
): void {
  if (depth > 8 || value === null || value === undefined) return

  if (Array.isArray(value)) {
    for (const child of value) collectNamedResources(child, resources, depth + 1)
    return
  }

  const record = asRecord(value)
  if (!record) return

  for (const [key, child] of Object.entries(record)) {
    const normalizedKey = key.toLowerCase()

    if (
      MODEL_RESOURCE_KEYS.has(normalizedKey) &&
      (typeof child === 'string' || typeof child === 'number')
    ) {
      const normalizedValue = String(child).trim().toLowerCase()
      if (normalizedValue) resources.add(`${normalizedKey}:${normalizedValue}`)
    }

    collectNamedResources(child, resources, depth + 1)
  }
}

function collectComfyLoaderSettings(
  payload: JsonRecord,
  loaderSettings: Set<string>,
): void {
  const workflow = asRecord(payload.workflow)
  if (!workflow) return

  for (const node of Object.values(workflow)) {
    const record = asRecord(node)
    if (!record) continue

    const classType = String(record.class_type || '').trim()
    if (!classType || !MODEL_LOADER_CLASS_PATTERN.test(classType)) continue

    const inputs = asRecord(record.inputs) ?? {}
    const stableInputs = Object.fromEntries(
      Object.entries(inputs)
        .filter(([key]) => !DYNAMIC_LOADER_INPUT_KEYS.has(key.toLowerCase()))
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => [key, stableValue(value)]),
    )

    loaderSettings.add(
      `${classType.toLowerCase()}:${JSON.stringify(stableInputs)}`,
    )
  }
}

export function artJobQueueAffinityKey(
  engine: string,
  rawPayload: unknown,
): string {
  const normalizedEngine = String(engine || 'UNKNOWN').toUpperCase()
  const payload = asRecord(rawPayload) ?? {}
  const resources = new Set<string>()
  const loaderSettings = new Set<string>()

  collectNamedResources(payload, resources)
  if (normalizedEngine === 'COMFY') {
    collectComfyLoaderSettings(payload, loaderSettings)
  }

  const parts = [...resources, ...loaderSettings].sort()
  return `${normalizedEngine}|${parts.length ? parts.join('|') : 'default'}`
}

export function selectSmartQueueCandidate<T extends ArtJobAffinityCandidate>(
  candidates: T[],
  preferredAffinity: string | null,
  maxBypass = 24,
): SmartQueueSelection<T> {
  const ordered = [...candidates].sort(
    (left, right) => right.priority - left.priority || left.id - right.id,
  )
  const oldest = ordered[0] ?? null

  if (!oldest) {
    return {
      candidate: null,
      affinityMatched: false,
      bypassedCount: 0,
      preferredAffinity,
      selectedAffinity: null,
    }
  }

  const oldestAffinity = artJobQueueAffinityKey(oldest.engine, oldest.payload)
  if (!preferredAffinity) {
    return {
      candidate: oldest,
      affinityMatched: false,
      bypassedCount: 0,
      preferredAffinity: null,
      selectedAffinity: oldestAffinity,
    }
  }

  const highestPriority = oldest.priority
  const samePriority = ordered.filter(
    (candidate) => candidate.priority === highestPriority,
  )
  const matchIndex = samePriority.findIndex((candidate) => {
    return (
      artJobQueueAffinityKey(candidate.engine, candidate.payload) ===
      preferredAffinity
    )
  })

  if (matchIndex >= 0 && matchIndex <= Math.max(0, maxBypass)) {
    const candidate = samePriority[matchIndex] ?? oldest
    return {
      candidate,
      affinityMatched: true,
      bypassedCount: matchIndex,
      preferredAffinity,
      selectedAffinity: artJobQueueAffinityKey(
        candidate.engine,
        candidate.payload,
      ),
    }
  }

  return {
    candidate: oldest,
    affinityMatched: oldestAffinity === preferredAffinity,
    bypassedCount: 0,
    preferredAffinity,
    selectedAffinity: oldestAffinity,
  }
}
